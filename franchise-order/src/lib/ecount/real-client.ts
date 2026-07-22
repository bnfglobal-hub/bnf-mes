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
   * 전표 라인 구성. 이카운트 테스트 서버(sboapi)에서 실제 전표를 발행해 검증한 규칙:
   *
   * - `UPLOAD_SER_NO`가 **전표를 묶는 키**다. 한 주문의 모든 품목에 같은 값을 넣어야
   *   전표 1건으로 등록된다. 줄마다 다른 값을 넣으면 품목 수만큼 전표가 쪼개진다.
   *   (검증: 서로 다른 값 → 전표 2개 / 같은 값 → 전표 1개)
   *   한 번의 요청에 주문 1건만 담으므로 고정값 "1"을 쓴다. 짧은 값("1","21")은 검증됐고
   *   8자리 값은 거부되었으므로 주문번호를 이 필드에 넣지 않는다(추적은 REMARKS로 한다).
   * - `IO_DATE`, `CUST`, `WH_CD`, `PROD_CD`, `QTY`, `PRICE`, `REMARKS` 정상 수용.
   * - 미등록 코드를 보내면 `ResultDetails.Errors`에 `ColCd`와 사유가 반환된다.
   */
  private buildBulkRows(payload: EcountOrderPayload) {
    const serNo = "1"; // 요청당 주문 1건 → 모든 줄을 한 전표로 묶는다
    return payload.lines.map((l, i) => {
      const row: Record<string, string> = {
        IO_DATE: payload.orderDate,
        UPLOAD_SER_NO: serNo,
        CUST: payload.customerCode,
        PROD_CD: l.itemCode,
        QTY: String(l.qty),
        PRICE: String(l.unitPrice),
        SUPPLY_AMT: String(l.supplyAmount),
        VAT_AMT: String(l.vatAmount),
        // 비고에 내부 주문번호 기록 → 추적용
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
    // 데이터 검증 오류(미등록코드 등)는 자동 재시도해도 같은 결과 → VALIDATION 으로 표시해
    // 재시도 없이 실패 처리한다. (이카운트 시간당 연속 오류 30건 제한을 소모하지 않기 위함)
    const isValidation = (detail?.Errors?.length ?? 0) > 0 || !!detail?.TotalError;
    return {
      ok: false,
      errorCode: isValidation ? "VALIDATION" : (d?.Code ?? "SAVE_FAIL"),
      errorMessage: errMsg,
      raw: res,
    };
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
   * ⚠️ 이카운트는 중복 전송을 막지 않는다 — 같은 주문번호(REMARKS)로 다시 보내면
   *    새 전표가 그대로 하나 더 생성된다. (테스트 서버에서 실측 확인)
   *    또한 전표 조회 API가 이 회사에 열려 있지 않아 등록 여부를 되물을 수 없다.
   *
   * 따라서 중복 방지는 전적으로 내부 큐의 idempotency_key(주문번호 기준 unique)와
   * "성공 여부가 불명확하면 재전송하지 않고 MANUAL_REVIEW로 전환"하는 정책에 의존한다.
   */
  async findOrderByKey(_key: string) {
    return { found: false };
  }
}
