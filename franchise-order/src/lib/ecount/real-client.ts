import "server-only";
import type { EcountClient, EcountItem, EcountOrderPayload, EcountPushResult, EcountStockRow } from "./types";

/**
 * 실제 이카운트 Open API 클라이언트 (구현 골격).
 *
 * ⚠️ 이카운트 공식 Open API 문서 기준으로 각 엔드포인트/필드를 채워야 한다.
 *    URL·필드를 추측으로 구현하지 않는다. 필요한 정보:
 *    - Zone 조회: /OAPI/V2/Zone
 *    - 로그인:   /OAPI/V2/OAPILogin (COM_CODE, USER_ID, API_CERT_KEY, LAN_TYPE, ZONE)
 *    - 주문서입력: /OAPI/V2/SaleOrder/SaveSaleOrder (문서 확인 필요)
 *    - 판매입력:  /OAPI/V2/Sale/SaveSale
 *    - 재고조회:  /OAPI/V2/InventoryBalance/GetListInventoryBalanceStatus
 *    - 품목조회:  /OAPI/V2/InventoryBasic/GetBasicProductsList
 *    정확한 요청/응답 스키마는 docs/ECOUNT_INTEGRATION.md 참고.
 */
export class RealEcountClient implements EcountClient {
  readonly mode = "REAL" as const;
  private sessionId: string | null = null;
  private zone: string | null = null;

  private get cfg() {
    const companyCode = process.env.ECOUNT_COMPANY_CODE;
    const userId = process.env.ECOUNT_API_USER_ID;
    const apiKey = process.env.ECOUNT_API_KEY;
    const baseUrl = process.env.ECOUNT_API_BASE_URL || "https://oapi.ecount.com";
    if (!companyCode || !userId || !apiKey) {
      throw new Error("ECOUNT 환경변수가 설정되지 않았습니다 (ECOUNT_COMPANY_CODE / ECOUNT_API_USER_ID / ECOUNT_API_KEY).");
    }
    return { companyCode, userId, apiKey, baseUrl };
  }

  private async request<T>(path: string, body: unknown, timeoutMs = 15000): Promise<T> {
    const { baseUrl } = this.cfg;
    const url = this.zone ? baseUrl.replace("oapi", `oapi${this.zone}`) + path : baseUrl + path;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    const { companyCode, userId, apiKey } = this.cfg;
    // 1) Zone 조회
    type ZoneRes = { Data?: { ZONE?: string } };
    const zoneRes = await this.request<ZoneRes>("/OAPI/V2/Zone", { COM_CODE: companyCode });
    this.zone = zoneRes?.Data?.ZONE ?? null;
    // 2) 로그인 → SESSION_ID
    type LoginRes = { Data?: { Datas?: { SESSION_ID?: string } } };
    const loginRes = await this.request<LoginRes>("/OAPI/V2/OAPILogin", {
      COM_CODE: companyCode,
      USER_ID: userId,
      API_CERT_KEY: apiKey,
      LAN_TYPE: "ko-KR",
      ZONE: this.zone,
    });
    this.sessionId = loginRes?.Data?.Datas?.SESSION_ID ?? null;
    if (!this.sessionId) throw new Error("이카운트 로그인 실패: SESSION_ID를 받지 못했습니다.");
  }

  async testConnection() {
    try {
      await this.login();
      return { ok: true, message: `이카운트 연결 성공 (Zone: ${this.zone})` };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "연결 실패" };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 필드 매핑 완료 시 사용
  async pushOrder(payload: EcountOrderPayload): Promise<EcountPushResult> {
    try {
      if (!this.sessionId) await this.login();
      // TODO: 공식 문서 기준 주문서입력 API 필드 매핑 후 활성화.
      //  요청 전 반드시 findOrderByKey 로 중복 확인, 타임아웃 시 indeterminate 반환.
      return {
        ok: false,
        errorCode: "NOT_IMPLEMENTED",
        errorMessage:
          "실제 이카운트 주문서입력 API 매핑이 아직 설정되지 않았습니다. docs/ECOUNT_INTEGRATION.md의 필드 매핑을 완료한 뒤 사용하세요. (Mock 모드로 전환하면 전체 흐름 테스트 가능)",
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // AbortError = 타임아웃 → 성공 여부 불명확
      if (e instanceof Error && e.name === "AbortError") {
        return { ok: false, indeterminate: true, errorCode: "TIMEOUT", errorMessage: "이카운트 응답 타임아웃 — 등록 여부를 확인해야 합니다." };
      }
      return { ok: false, errorCode: "ERROR", errorMessage: msg };
    }
  }

  async pushSale(payload: EcountOrderPayload): Promise<EcountPushResult> {
    return this.pushOrder(payload); // TODO: 판매입력 API 분리 구현
  }

  async fetchItems(): Promise<EcountItem[]> {
    if (!this.sessionId) await this.login();
    // TODO: 품목조회 API 매핑
    return [];
  }

  async fetchStocks(): Promise<EcountStockRow[]> {
    if (!this.sessionId) await this.login();
    // TODO: 재고조회 API 매핑
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 조회 API 매핑 시 사용
  async findOrderByKey(_key: string) {
    // TODO: 주문 조회 API로 비고/주문번호 검색 매핑
    return { found: false };
  }
}
