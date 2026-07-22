import "server-only";
import type { EcountClient, EcountItem, EcountOrderPayload, EcountPushResult, EcountStockRow } from "./types";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Mock ECOUNT — 실제 이카운트 없이 전체 흐름을 검증한다.
 * 등록된 주문은 system_settings('mock_ecount.orders')에 저장해 idempotency를 재현한다.
 */
export class MockEcountClient implements EcountClient {
  readonly mode = "MOCK" as const;

  /** 테스트를 위해 실패를 강제할 수 있다: system_settings('mock_ecount.fail_next') = true */
  async testConnection() {
    return { ok: true, message: "Mock ECOUNT 연결 정상 (실제 이카운트에 전송되지 않습니다)" };
  }

  private async loadState(): Promise<Record<string, string>> {
    const admin = createAdminClient();
    const { data } = await admin.from("system_settings").select("value").eq("key", "mock_ecount.orders").maybeSingle();
    return (data?.value as Record<string, string>) ?? {};
  }

  private async saveState(state: Record<string, string>) {
    const admin = createAdminClient();
    await admin.from("system_settings").upsert({ key: "mock_ecount.orders", value: state });
  }

  private async shouldFail(): Promise<boolean> {
    const admin = createAdminClient();
    const { data } = await admin.from("system_settings").select("value").eq("key", "mock_ecount.fail_next").maybeSingle();
    if (data?.value === true) {
      await admin.from("system_settings").upsert({ key: "mock_ecount.fail_next", value: false });
      return true;
    }
    return false;
  }

  async pushOrder(payload: EcountOrderPayload): Promise<EcountPushResult> {
    if (await this.shouldFail()) {
      return { ok: false, errorCode: "MOCK_FAIL", errorMessage: "Mock 강제 실패 (mock_ecount.fail_next)" };
    }
    const state = await this.loadState();
    // idempotency: 같은 키는 같은 전표번호 반환 (중복 등록 방지)
    if (state[payload.idempotencyKey]) {
      return { ok: true, docNo: state[payload.idempotencyKey], raw: { duplicated: true } };
    }
    const docNo = `MOCK-${payload.orderDate}-${String(Object.keys(state).length + 1).padStart(4, "0")}`;
    state[payload.idempotencyKey] = docNo;
    await this.saveState(state);
    return { ok: true, docNo, raw: { lines: payload.lines.length } };
  }

  async pushSale(payload: EcountOrderPayload): Promise<EcountPushResult> {
    return this.pushOrder({ ...payload, idempotencyKey: `SALE:${payload.idempotencyKey}` });
  }

  async fetchItems(): Promise<EcountItem[]> {
    const admin = createAdminClient();
    const { data } = await admin.from("products").select("ecount_item_code, name, spec, order_unit").not("ecount_item_code", "is", null);
    return (data ?? []).map((p) => ({ itemCode: p.ecount_item_code!, itemName: p.name, spec: p.spec ?? undefined, unit: p.order_unit }));
  }

  async fetchStocks(): Promise<EcountStockRow[]> {
    // Mock: 현재 스냅샷 수량에 약간의 변화를 준 값 반환
    const admin = createAdminClient();
    const { data: whs } = await admin.from("warehouses").select("code").eq("is_active", true);
    const { data: prods } = await admin.from("products").select("ecount_item_code, id").not("ecount_item_code", "is", null);
    const rows: EcountStockRow[] = [];
    for (const p of prods ?? []) {
      for (const w of whs ?? []) {
        // 결정적 의사난수(품목코드 해시 기반) — 데모용
        const seed = [...(p.ecount_item_code! + w.code)].reduce((a, c) => a + c.charCodeAt(0), 0);
        rows.push({ itemCode: p.ecount_item_code!, warehouseCode: w.code, qty: 50 + (seed % 200) });
      }
    }
    return rows;
  }

  async findOrderByKey(key: string) {
    const state = await this.loadState();
    return state[key] ? { found: true, docNo: state[key] } : { found: false };
  }
}
