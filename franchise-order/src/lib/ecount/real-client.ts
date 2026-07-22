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
  Errors?: { Code?: string; Message?: string }[] | null;
  Error?: { Message?: string } | null;
}

/**
 * 이카운트 전송 기준(2026-07 기준, API인증현황 화면 고지):
 *
 * | 구분 | 실서버 | 테스트 |
 * |---|---|---|
 * | 저장(전표 발행) | 1회 / 10초 | 1회 / 10초 |
 * | 조회·현황(단건) | 1회 / 1초 | 1회 / 10초 |
 * | 조회·현황·로그인 | 1회 / **10분** | 1회 / 10초 |
 *
 * 특히 **실서버 로그인은 10분에 1회**뿐이라 매 요청마다 로그인하면 즉시 차단된다.
 * → 세션을 모듈 단위로 캐시해 재사용하고, 저장 호출은 최소 10초 간격을 강제한다.
 */
const SAVE_INTERVAL_MS = 10_000;
const SESSION_TTL_MS = 30 * 60_000;  // 세션 재사용 한도
const LOGIN_COOLDOWN_LIVE_MS = 10 * 60_000;
const LOGIN_COOLDOWN_TEST_MS = 10_000;

interface CachedSession {
  sessionId: string;
  zoneBase: string;
  issuedAt: number;
}
// 프로세스 단위 캐시 (인스턴스가 매 요청 새로 생성돼도 세션은 공유된다)
const sessionCache = new Map<string, CachedSession>();
const lastLoginAt = new Map<string, number>();
let lastSaveAt = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  private get isTestServer() {
    return this.cfg.baseUrl.includes("sboapi");
  }

  private get cacheKey() {
    const { companyCode, userId, baseUrl } = this.cfg;
    return `${baseUrl}|${companyCode}|${userId}`;
  }

  /** 저장(전표 발행) 호출 간 최소 10초 간격 강제 */
  private async throttleSave(): Promise<void> {
    const wait = SAVE_INTERVAL_MS - (Date.now() - lastSaveAt);
    if (wait > 0) await sleep(wait);
    lastSaveAt = Date.now();
  }

  private async login(): Promise<void> {
    const key = this.cacheKey;
    const cooldown = this.isTestServer ? LOGIN_COOLDOWN_TEST_MS : LOGIN_COOLDOWN_LIVE_MS;
    const since = Date.now() - (lastLoginAt.get(key) ?? 0);
    if (since < cooldown) {
      // 실서버는 로그인 10분 1회 제한 — 초과 호출은 차단으로 이어지므로 시도조차 하지 않는다
      const left = Math.ceil((cooldown - since) / 1000);
      throw new Error(`이카운트 로그인 제한(${cooldown / 60000}분에 1회) — ${left}초 후 다시 시도하세요.`);
    }
    lastLoginAt.set(key, Date.now());

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
    sessionCache.set(key, { sessionId: this.sessionId, zoneBase: this.zoneBase!, issuedAt: Date.now() });
  }

  /** 캐시된 세션을 우선 재사용한다 (실서버 로그인 10분 1회 제한 대응) */
  private async ensureSession(): Promise<string> {
    const cached = sessionCache.get(this.cacheKey);
    if (cached && Date.now() - cached.issuedAt < SESSION_TTL_MS) {
      this.sessionId = cached.sessionId;
      this.zoneBase = cached.zoneBase;
      return this.sessionId;
    }
    await this.login();
    return this.sessionId!;
  }

  /** 세션이 만료(Please login)된 경우 1회만 재로그인 후 재시도 */
  private async withSession<T extends EcountApiEnvelope>(
    call: (sess: string) => Promise<T>
  ): Promise<T> {
    const sess = await this.ensureSession();
    const res = await call(sess);
    if (res?.Errors?.[0]?.Message?.includes("Please login") || res?.Error?.Message?.includes("Please login")) {
      sessionCache.delete(this.cacheKey);
      const fresh = await this.ensureSession();
      return call(fresh);
    }
    return res;
  }

  async testConnection() {
    try {
      await this.ensureSession(); // 캐시 재사용 — 불필요한 로그인으로 제한을 소모하지 않음
      return {
        ok: true,
        message: `이카운트 ${this.isTestServer ? "테스트(sboapi)" : "실서버(oapi)"} 연결 정상 (${this.zoneBase})`,
      };
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
      await this.throttleSave(); // 저장 10초 1회 제한
      const res = await this.withSession((sess) =>
        this.post(`${this.zoneBase}/OAPI/V2/SaleOrder/SaveSaleOrder?SESSION_ID=${sess}`,
          { SaleOrderList: this.buildBulkRows(payload) })
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
      await this.throttleSave(); // 저장 10초 1회 제한
      const res = await this.withSession((sess) =>
        this.post(`${this.zoneBase}/OAPI/V2/Sale/SaveSale?SESSION_ID=${sess}`,
          { SaleList: this.buildBulkRows(payload) })
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
    const res = await this.withSession((sess) =>
      this.post(`${this.zoneBase}/OAPI/V2/InventoryBasic/GetBasicProductsList?SESSION_ID=${sess}`, {}, 60_000));
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
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const baseDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const res = await this.withSession((sess) =>
      this.post(`${this.zoneBase}/OAPI/V2/InventoryBalance/GetListInventoryBalanceStatus?SESSION_ID=${sess}`, { BASE_DATE: baseDate }, 60_000));
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
