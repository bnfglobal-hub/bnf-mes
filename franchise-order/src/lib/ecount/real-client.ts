import "server-only";
import type { EcountClient, EcountItem, EcountOrderPayload, EcountPushResult, EcountStockRow } from "./types";

/**
 * 실제 이카운트 Open API 클라이언트.
 *
 * 엔드포인트·필드는 기존 운영 중인 BNF 연동 스크립트(문서\bnf-ecount)에서 검증된 방식 사용:
 *  - Zone:   POST {base}/OAPI/V2/Zone                     { COM_CODE }
 *  - 로그인: POST {base+zone}/OAPI/V2/OAPILogin           { COM_CODE, USER_ID, API_CERT_KEY, LAN_TYPE, ZONE }
 *  - 재고:   POST .../InventoryBalance/GetListInventoryBalanceStatus?SESSION_ID=  { BASE_DATE } → PROD_CD/BAL_QTY
 *  - 품목:   POST .../InventoryBasic/GetBasicProductsList?SESSION_ID=  {} → PROD_CD/PROD_DES/SIZE_DES
 *  - 판매입력:   POST .../Sale/SaveSale?SESSION_ID=            { SaleList: [{ BulkDatas: {...} }] }
 *  - 주문서입력: POST .../SaleOrder/SaveSaleOrder?SESSION_ID=  { SaleOrderList: [{ BulkDatas: {...} }] }
 *
 * ECOUNT_API_BASE_URL 이 sboapi.ecount.com 이면 테스트 서버(테스트 인증키),
 * oapi.ecount.com 이면 실서버(본 인증키, IP등록 필요).
 */

interface EcountApiEnvelope {
  Data?: {
    ZONE?: string;
    Code?: string;
    Message?: string;
    Datas?: { SESSION_ID?: string };
    Result?: unknown[];
    SuccessCnt?: number;
    FailCnt?: number;
    SlipNos?: string[];
    ResultDetails?: { IsSuccess?: boolean; TotalError?: string; Errors?: { ColCd?: string; Message?: string }[] }[];
  };
  Status?: string;
  Error?: { Message?: string } | null;
}

export class RealEcountClient implements EcountClient {
  readonly mode = "REAL" as const;
  private sessionId: string | null = null;
  private zoneBase: string | null = null;

  private get cfg() {
    const companyCode = process.env.ECOUNT_COMPANY_CODE;
    const userId = process.env.ECOUNT_API_USER_ID;
    const apiKey = process.env.ECOUNT_API_KEY;
    const baseUrl = (process.env.ECOUNT_API_BASE_URL || "https://sboapi.ecount.com").replace(/\/$/, "");
    if (!companyCode || !userId || !apiKey) {
      throw new Error("ECOUNT 환경변수가 설정되지 않았습니다 (ECOUNT_COMPANY_CODE / ECOUNT_API_USER_ID / ECOUNT_API_KEY).");
    }
    return { companyCode, userId, apiKey, baseUrl };
  }

  private async post<T extends EcountApiEnvelope>(url: string, body: unknown, timeoutMs = 20000): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  private async login(): Promise<void> {
    const { companyCode, userId, apiKey, baseUrl } = this.cfg;
    const zoneRes = await this.post(`${baseUrl}/OAPI/V2/Zone`, { COM_CODE: companyCode });
    const zone = zoneRes?.Data?.ZONE;
    if (!zone) throw new Error("이카운트 Zone 조회 실패");
    // https://sboapi.ecount.com → https://sboapi{zone}.ecount.com
    this.zoneBase = baseUrl.replace(/^(https:\/\/[a-z]+)\./, `$1${zone}.`);
    const loginRes = await this.post(`${this.zoneBase}/OAPI/V2/OAPILogin`, {
      COM_CODE: companyCode,
      USER_ID: userId,
      API_CERT_KEY: apiKey,
      LAN_TYPE: "ko-KR",
      ZONE: zone,
    });
    this.sessionId = loginRes?.Data?.Datas?.SESSION_ID ?? null;
    if (!this.sessionId) {
      const msg = loginRes?.Data?.Message?.replace(/<br \/>/g, " ") ?? "알 수 없는 오류";
      throw new Error(`이카운트 로그인 실패: ${loginRes?.Data?.Code ?? ""} ${msg}`);
    }
  }

  private async ensureSession(): Promise<string> {
    if (!this.sessionId) await this.login();
    return this.sessionId!;
  }

  async testConnection() {
    try {
      await this.login();
      const isTest = this.cfg.baseUrl.includes("sboapi");
      return { ok: true, message: `이카운트 ${isTest ? "테스트(sboapi)" : "실서버(oapi)"} 로그인 성공 (${this.zoneBase})` };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "연결 실패" };
    }
  }

  /**
   * 전표 라인 구성.
   * 필드명은 이카운트 테스트 서버(sboapi)에서 실제 호출로 검증됨:
   * IO_DATE / UPLOAD_SER_NO / CUST / PROD_CD / QTY / PRICE / REMARKS 는 정상 수용.
   * (미검증 코드를 넣으면 ResultDetails.Errors 에 ColCd 와 사유가 반환된다)
   */
  private buildBulkRows(payload: EcountOrderPayload) {
    return payload.lines.map((l, i) => {
      const row: Record<string, string> = {
        IO_DATE: payload.orderDate,
        UPLOAD_SER_NO: String(i + 1),
        CUST: payload.customerCode,
        PROD_CD: l.itemCode,
        QTY: String(l.qty),
        PRICE: String(l.unitPrice),
        SUPPLY_AMT: String(l.supplyAmount),
        VAT_AMT: String(l.vatAmount),
        // 비고에 내부 주문번호 기록 → 중복 확인·추적용
        REMARKS: i === 0 && payload.memo ? `${payload.orderNo} ${payload.memo}`.slice(0, 100) : payload.orderNo,
      };
      if (l.warehouseCode) row.WH_CD = l.warehouseCode; // 빈 값이면 전송하지 않음(미등록코드 오류 방지)
      return { Line: String(i), BulkDatas: row };
    });
  }

  private parseSaveResult(res: EcountApiEnvelope, orderNo: string): EcountPushResult {
    const d = res?.Data;
    const failCnt = Number(d?.FailCnt ?? 0);
    const successCnt = Number(d?.SuccessCnt ?? 0);
    if (successCnt > 0 && failCnt === 0) {
      const docNo = d?.SlipNos?.length ? d.SlipNos.join(",") : orderNo;
      return { ok: true, docNo, raw: { successCnt, slipNos: d?.SlipNos } };
    }
    const detail = d?.ResultDetails?.find((r) => !r.IsSuccess);
    const errMsg =
      detail?.Errors?.map((e) => `${e.ColCd ?? ""} ${e.Message ?? ""}`.trim()).join("; ") ||
      detail?.TotalError ||
      d?.Message ||
      "이카운트 저장 실패";
    return { ok: false, errorCode: d?.Code ?? "SAVE_FAIL", errorMessage: errMsg, raw: res };
  }

  /** 주문서 입력 */
  async pushOrder(payload: EcountOrderPayload): Promise<EcountPushResult> {
    try {
      const sess = await this.ensureSession();
      const res = await this.post(
        `${this.zoneBase}/OAPI/V2/SaleOrder/SaveSaleOrder?SESSION_ID=${sess}`,
        { SaleOrderList: this.buildBulkRows(payload) }
      );
      return this.parseSaveResult(res, payload.orderNo);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        return { ok: false, indeterminate: true, errorCode: "TIMEOUT", errorMessage: "이카운트 응답 타임아웃 — 이카운트에서 주문번호로 등록 여부를 확인하세요." };
      }
      return { ok: false, errorCode: "ERROR", errorMessage: e instanceof Error ? e.message : String(e) };
    }
  }

  /** 판매 입력 */
  async pushSale(payload: EcountOrderPayload): Promise<EcountPushResult> {
    try {
      const sess = await this.ensureSession();
      const res = await this.post(
        `${this.zoneBase}/OAPI/V2/Sale/SaveSale?SESSION_ID=${sess}`,
        { SaleList: this.buildBulkRows(payload) }
      );
      return this.parseSaveResult(res, payload.orderNo);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        return { ok: false, indeterminate: true, errorCode: "TIMEOUT", errorMessage: "이카운트 응답 타임아웃 — 이카운트에서 주문번호로 등록 여부를 확인하세요." };
      }
      return { ok: false, errorCode: "ERROR", errorMessage: e instanceof Error ? e.message : String(e) };
    }
  }

  async fetchItems(): Promise<EcountItem[]> {
    const sess = await this.ensureSession();
    const res = await this.post(`${this.zoneBase}/OAPI/V2/InventoryBasic/GetBasicProductsList?SESSION_ID=${sess}`, {});
    const rows = (res?.Data?.Result ?? []) as {
      PROD_CD?: string; PROD_DES?: string; SIZE_DES?: string; UNIT?: string; BAR_CODE?: string; OUT_PRICE?: string | number;
    }[];
    return rows
      .filter((r) => r.PROD_CD)
      .map((r) => ({
        itemCode: String(r.PROD_CD),
        itemName: String(r.PROD_DES ?? ""),
        spec: r.SIZE_DES ? String(r.SIZE_DES) : undefined,
        unit: r.UNIT ? String(r.UNIT) : undefined,
        barcode: r.BAR_CODE ? String(r.BAR_CODE) : undefined,
        outPrice: r.OUT_PRICE != null ? Math.round(Number(r.OUT_PRICE)) : undefined,
      }));
  }

  async fetchStocks(): Promise<EcountStockRow[]> {
    const sess = await this.ensureSession();
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const baseDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const res = await this.post(`${this.zoneBase}/OAPI/V2/InventoryBalance/GetListInventoryBalanceStatus?SESSION_ID=${sess}`, { BASE_DATE: baseDate });
    const rows = (res?.Data?.Result ?? []) as { PROD_CD?: string; BAL_QTY?: number | string; WH_CD?: string }[];
    const defaultWh = process.env.ECOUNT_DEFAULT_WAREHOUSE_CODE || "";
    return rows
      .filter((r) => r.PROD_CD)
      .map((r) => ({
        itemCode: String(r.PROD_CD),
        warehouseCode: r.WH_CD ? String(r.WH_CD) : defaultWh,
        qty: Number(r.BAL_QTY ?? 0),
      }));
  }

  /**
   * idempotency 확인 — 이카운트 OAPI에는 비고 검색 API가 없어 큐의 unique key로 중복을 차단한다.
   * 타임아웃 후에는 재전송하지 않고 MANUAL_REVIEW로 전환되므로 여기서는 항상 미발견 처리.
   */
  async findOrderByKey(_key: string) {
    return { found: false };
  }
}
