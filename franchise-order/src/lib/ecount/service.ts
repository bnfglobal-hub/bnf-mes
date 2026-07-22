import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { MockEcountClient } from "./mock-client";
import { RealEcountClient } from "./real-client";
import type { EcountClient, EcountOrderPayload } from "./types";

const MASK_KEYS = ["password", "api_cert_key", "apikey", "api_key", "session_id", "secret", "token"];

export function maskSensitive(obj: unknown): unknown {
  if (obj == null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitive);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[k] = MASK_KEYS.some((m) => k.toLowerCase().includes(m)) ? "***" : maskSensitive(v);
  }
  return out;
}

export function getEcountClient(): EcountClient {
  const mode = (process.env.ECOUNT_SYNC_ENABLED === "true" && process.env.ECOUNT_MODE === "REAL") ? "REAL" : "MOCK";
  return mode === "REAL" ? new RealEcountClient() : new MockEcountClient();
}

/** 지수 백오프: 1분 → 2분 → 4분 → 8분 → 16분 */
export function backoffMinutes(attempts: number): number {
  return Math.min(2 ** Math.max(0, attempts - 1), 16);
}

/** 확정된 주문을 전송 큐에 등록 (idempotency key = 주문번호) */
export async function queueOrderPush(orderId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("id, order_no, erp_status").eq("id", orderId).single();
  if (!order) throw new Error("주문을 찾을 수 없습니다.");
  const key = `ORDER:${order.order_no}`;
  // 이미 큐가 있으면 재사용 (중복 방지)
  const { error } = await admin.from("ecount_sync_jobs").insert({
    job_type: "ORDER_PUSH",
    order_id: order.id,
    idempotency_key: key,
    status: "QUEUED",
    next_retry_at: new Date().toISOString(),
  });
  if (error && !error.message.includes("duplicate")) throw error;
  await admin.from("orders").update({ erp_status: "QUEUED", idempotency_key: key }).eq("id", order.id);
}

async function buildOrderPayload(orderId: string): Promise<EcountOrderPayload> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("*, order_items(*), stores(name, ecount_customer_code, delivery_note), warehouses(code)")
    .eq("id", orderId)
    .single();
  if (!order) throw new Error("주문을 찾을 수 없습니다.");
  const customerCode = order.ecount_customer_code || order.stores?.ecount_customer_code;
  if (!customerCode) throw new Error(`가맹점(${order.stores?.name})에 이카운트 거래처코드가 없습니다.`);
  const whCode = order.warehouses?.code || process.env.ECOUNT_DEFAULT_WAREHOUSE_CODE || "";
  const lines = (order.order_items as Array<Record<string, unknown>>).map((it) => {
    const snap = it.product_snapshot as { ecount_item_code?: string; name?: string };
    if (!snap?.ecount_item_code) throw new Error(`품목(${snap?.name})에 이카운트 품목코드가 없습니다.`);
    return {
      itemCode: snap.ecount_item_code,
      qty: Number(it.qty),
      unitPrice: Number(it.unit_price),
      supplyAmount: Number(it.supply_amount),
      vatAmount: Number(it.vat_amount),
      warehouseCode: whCode,
      remark: order.order_no as string,
    };
  });
  const d = new Date(order.ordered_at as string);
  return {
    idempotencyKey: `ORDER:${order.order_no}`,
    orderNo: order.order_no as string,
    customerCode,
    orderDate: `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`,
    lines,
    memo: (order.memo as string) ?? undefined,
    deliveryNote: (order.ship_to as { delivery_note?: string })?.delivery_note,
  };
}

/** 큐 처리 — cron 또는 관리자 수동 실행. 반환: 처리 건수 */
export async function processSyncQueue(limit = 10): Promise<{ processed: number; success: number; failed: number }> {
  const admin = createAdminClient();
  const client = getEcountClient();
  const now = new Date().toISOString();
  const { data: jobs } = await admin
    .from("ecount_sync_jobs")
    .select("*")
    .in("status", ["QUEUED", "RETRYING", "FAILED"])
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .order("created_at")
    .limit(limit);

  let success = 0, failed = 0;
  for (const job of jobs ?? []) {
    if (job.attempts >= job.max_attempts) {
      await admin.from("ecount_sync_jobs").update({ status: "MANUAL_REVIEW", last_error_message: "최대 재시도 횟수 초과 — 수동 확인 필요" }).eq("id", job.id);
      if (job.order_id) await admin.from("orders").update({ erp_status: "MANUAL_REVIEW" }).eq("id", job.order_id);
      continue;
    }
    await admin.from("ecount_sync_jobs").update({ status: "SYNCING", attempts: job.attempts + 1 }).eq("id", job.id);
    if (job.order_id) await admin.from("orders").update({ erp_status: "SYNCING" }).eq("id", job.order_id);
    try {
      const payload = await buildOrderPayload(job.order_id);
      await admin.from("ecount_sync_logs").insert({
        job_id: job.id, direction: "REQUEST", summary: `${client.mode} pushOrder ${payload.orderNo}`,
        masked_payload: maskSensitive(payload) as object,
      });
      // 재시도 전 기존 등록 여부 확인 (중복 등록 방지)
      if (job.attempts > 0) {
        const existing = await client.findOrderByKey(payload.idempotencyKey);
        if (existing.found) {
          await markJobSuccess(job.id, job.order_id, existing.docNo ?? null, { duplicatedCheck: true });
          success++;
          continue;
        }
      }
      const result = await client.pushOrder(payload);
      await admin.from("ecount_sync_logs").insert({
        job_id: job.id, direction: "RESPONSE", summary: result.ok ? `성공 ${result.docNo}` : `실패 ${result.errorCode}`,
        masked_payload: maskSensitive(result) as object,
      });
      if (result.ok) {
        await markJobSuccess(job.id, job.order_id, result.docNo ?? null, result.raw);
        success++;
      } else if (result.indeterminate) {
        await admin.from("ecount_sync_jobs").update({
          status: "MANUAL_REVIEW", last_error_code: result.errorCode, last_error_message: result.errorMessage,
        }).eq("id", job.id);
        if (job.order_id) await admin.from("orders").update({ erp_status: "MANUAL_REVIEW" }).eq("id", job.order_id);
        failed++;
      } else {
        await scheduleRetry(job.id, job.order_id, job.attempts + 1, result.errorCode, result.errorMessage);
        failed++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await scheduleRetry(job.id, job.order_id, job.attempts + 1, "EXCEPTION", msg);
      failed++;
    }
  }
  return { processed: (jobs ?? []).length, success, failed };
}

async function markJobSuccess(jobId: string, orderId: string | null, docNo: string | null, raw: unknown) {
  const admin = createAdminClient();
  await admin.from("ecount_sync_jobs").update({ status: "SUCCESS", ecount_doc_no: docNo, response: maskSensitive(raw) as object }).eq("id", jobId);
  if (orderId) await admin.from("orders").update({ erp_status: "SUCCESS", ecount_doc_no: docNo }).eq("id", orderId);
}

async function scheduleRetry(jobId: string, orderId: string | null, attempts: number, code?: string, message?: string) {
  const admin = createAdminClient();
  const next = new Date(Date.now() + backoffMinutes(attempts) * 60_000).toISOString();
  await admin.from("ecount_sync_jobs").update({
    status: "RETRYING", next_retry_at: next, last_error_code: code ?? null, last_error_message: message ?? null,
  }).eq("id", jobId);
  if (orderId) await admin.from("orders").update({ erp_status: "RETRYING" }).eq("id", orderId);
}

/** 재고 동기화: 이카운트 재고를 스냅샷 테이블에 반영 */
export async function syncStocks(): Promise<{ updated: number }> {
  const admin = createAdminClient();
  const client = getEcountClient();
  const rows = await client.fetchStocks();
  const { data: whs } = await admin.from("warehouses").select("id, code");
  const { data: prods } = await admin.from("products").select("id, ecount_item_code").not("ecount_item_code", "is", null);
  const whMap = new Map((whs ?? []).map((w) => [w.code, w.id]));
  const prodMap = new Map((prods ?? []).map((p) => [p.ecount_item_code!, p.id]));
  let updated = 0;
  const syncedAt = new Date().toISOString();
  for (const row of rows) {
    const productId = prodMap.get(row.itemCode);
    const warehouseId = whMap.get(row.warehouseCode);
    if (!productId || !warehouseId) continue;
    await admin.from("inventory_snapshots").upsert(
      { product_id: productId, warehouse_id: warehouseId, qty: row.qty, synced_at: syncedAt },
      { onConflict: "product_id,warehouse_id" }
    );
    updated++;
  }
  return { updated };
}
