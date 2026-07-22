"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, ADMIN_ROLES, STAFF_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { changeOrderStatus } from "@/lib/domain/order-service";
import { processSyncQueue, syncStocks, getEcountClient, queueOrderPush } from "@/lib/ecount/service";
import { auditLog } from "@/lib/audit";
import { notifyStore } from "@/lib/notify";
import { usernameToEmail, isValidUsername, normalizeUsername, INITIAL_PASSWORD } from "@/lib/login-domain";
import { calcLine, type TaxType } from "@/lib/domain/pricing";

// ---------- 주문 ----------

export async function orderStatusAction(orderId: string, toStatus: string, reason?: string) {
  const profile = await requireRole(STAFF_ROLES);
  // 창고 직원은 피킹/출고 관련 상태만
  if (profile.role === "warehouse" && !["PICKING", "PICKED", "SHIPPED", "PARTIALLY_SHIPPED", "DELIVERED"].includes(toStatus)) {
    return { ok: false, error: "권한이 없습니다." };
  }
  const r = await changeOrderStatus({ orderId, toStatus, actorId: profile.id, actorName: profile.full_name, reason });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return r;
}

export async function bulkConfirmAction(orderIds: string[]) {
  const profile = await requireRole(ADMIN_ROLES);
  let ok = 0, fail = 0;
  for (const id of orderIds) {
    const r = await changeOrderStatus({ orderId: id, toStatus: "CONFIRMED", actorId: profile.id, actorName: profile.full_name });
    if (r.ok) ok++; else fail++;
  }
  revalidatePath("/admin/orders");
  return { ok: true, confirmed: ok, failed: fail };
}

/** 관리자 주문 수량 수정 (감사 이력 포함) */
export async function updateOrderItemsAction(orderId: string, changes: { orderItemId: string; qty: number }[], reason: string) {
  const profile = await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("*, order_items(*), stores(delivery_fee, free_delivery_threshold, min_amount_basis)").eq("id", orderId).single();
  if (!order) return { ok: false, error: "주문을 찾을 수 없습니다." };
  if (!["PENDING", "CONFIRMED"].includes(order.status)) return { ok: false, error: "접수/확정 상태에서만 수정할 수 있습니다." };

  const before: Record<string, number> = {};
  const after: Record<string, number> = {};
  for (const ch of changes) {
    const item = (order.order_items as Array<Record<string, unknown>>).find((i) => i.id === ch.orderItemId);
    if (!item) continue;
    before[String((item.product_snapshot as { name: string }).name)] = Number(item.qty);
    after[String((item.product_snapshot as { name: string }).name)] = ch.qty;
    if (ch.qty === 0) {
      await admin.from("order_items").delete().eq("id", ch.orderItemId);
    } else {
      const snap = item.product_snapshot as { tax_type?: string };
      const amounts = calcLine({ qty: ch.qty, unitPrice: Number(item.unit_price), taxType: (snap.tax_type ?? "TAXABLE") as TaxType });
      await admin.from("order_items").update({ qty: ch.qty, supply_amount: amounts.supplyAmount, vat_amount: amounts.vatAmount }).eq("id", ch.orderItemId);
    }
  }

  // 합계 재계산
  const { data: items } = await admin.from("order_items").select("supply_amount, vat_amount, product_id, qty").eq("order_id", orderId);
  const supply = (items ?? []).reduce((s, i) => s + Number(i.supply_amount), 0);
  const vat = (items ?? []).reduce((s, i) => s + Number(i.vat_amount), 0);
  const st = order.stores;
  const basisAmount = st?.min_amount_basis === "WITH_VAT" ? supply + vat : supply;
  let deliveryFee = Number(order.delivery_fee);
  if (st?.free_delivery_threshold != null) deliveryFee = basisAmount >= Number(st.free_delivery_threshold) ? 0 : Number(st.delivery_fee);
  await admin.from("orders").update({ supply_amount: supply, vat_amount: vat, delivery_fee: deliveryFee, total_amount: supply + vat + deliveryFee }).eq("id", orderId);

  // 재고 예약 갱신
  await admin.from("inventory_reservations").update({ released: true }).eq("order_id", orderId);
  if ((items ?? []).length > 0) {
    await admin.from("inventory_reservations").insert((items ?? []).map((i) => ({
      order_id: orderId, product_id: i.product_id, warehouse_id: order.warehouse_id, qty: i.qty,
    })));
  }

  await auditLog({ actorId: profile.id, actorName: profile.full_name, action: "ORDER_ITEMS_UPDATE", entity: "orders", entityId: orderId, before, after: { ...after, reason } });
  await admin.from("order_status_histories").insert({ order_id: orderId, from_status: order.status, to_status: order.status, changed_by: profile.id, reason: `수량 수정: ${reason}` });
  await notifyStore(order.store_id, "ORDER_UPDATED", "주문이 수정되었습니다", `${order.order_no} — ${reason}`, `/app/orders/${orderId}`);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

// ---------- 피킹/출고 ----------

export async function setPickedQtyAction(orderItemId: string, pickedQty: number) {
  const profile = await requireRole(STAFF_ROLES);
  const admin = createAdminClient();
  const { data: item } = await admin.from("order_items").select("id, qty, order_id").eq("id", orderItemId).single();
  if (!item) return { ok: false, error: "품목을 찾을 수 없습니다." };
  const shortage = Math.max(0, item.qty - pickedQty);
  await admin.from("order_items").update({ shipped_qty: pickedQty, unshipped_reason: shortage > 0 ? "재고 부족" : null }).eq("id", orderItemId);
  await auditLog({ actorId: profile.id, actorName: profile.full_name, action: "PICKING_QTY", entity: "order_items", entityId: orderItemId, after: { pickedQty, shortage } });
  revalidatePath("/admin/picking");
  return { ok: true };
}

const shipSchema = z.object({
  orderId: z.string().uuid(),
  driverName: z.string().max(30).optional(),
  vehicleNo: z.string().max(20).optional(),
  trackingNo: z.string().max(40).optional(),
  memo: z.string().max(300).optional(),
});

export async function createShipmentAction(input: z.infer<typeof shipSchema>) {
  const profile = await requireRole(STAFF_ROLES);
  const parsed = shipSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "입력값이 올바르지 않습니다." };
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("id, order_no, status, store_id, order_items(id, qty, shipped_qty)").eq("id", input.orderId).single();
  if (!order) return { ok: false, error: "주문을 찾을 수 없습니다." };

  const items = order.order_items as { id: string; qty: number; shipped_qty: number }[];
  const anyShort = items.some((i) => (i.shipped_qty || i.qty) < i.qty);
  // shipped_qty가 0(피킹 입력 안함)이면 전량 출고 처리
  for (const i of items) {
    if (!i.shipped_qty) await admin.from("order_items").update({ shipped_qty: i.qty }).eq("id", i.id);
  }

  const { data: shipment } = await admin.from("shipments").insert({
    order_id: order.id, driver_name: parsed.data.driverName ?? null, vehicle_no: parsed.data.vehicleNo ?? null,
    tracking_no: parsed.data.trackingNo ?? null, memo: parsed.data.memo ?? null,
    departed_at: new Date().toISOString(), created_by: profile.id,
  }).select("id").single();
  if (shipment) {
    await admin.from("shipment_items").insert(items.map((i) => ({ shipment_id: shipment.id, order_item_id: i.id, qty: i.shipped_qty || i.qty })));
  }
  await admin.from("inventory_reservations").update({ released: true }).eq("order_id", order.id);
  const r = await changeOrderStatus({
    orderId: order.id, toStatus: anyShort ? "PARTIALLY_SHIPPED" : "SHIPPED",
    actorId: profile.id, actorName: profile.full_name,
  });
  revalidatePath("/admin/shipping");
  revalidatePath("/admin/orders");
  return r;
}

// ---------- 이카운트 ----------

export async function runSyncQueueAction() {
  await requireRole(ADMIN_ROLES);
  const r = await processSyncQueue(20);
  revalidatePath("/admin/ecount");
  revalidatePath("/admin/orders");
  return { ok: true, ...r };
}

export async function retrySyncJobAction(jobId: string) {
  const profile = await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  await admin.from("ecount_sync_jobs").update({ status: "QUEUED", next_retry_at: new Date().toISOString(), attempts: 0 }).eq("id", jobId);
  await auditLog({ actorId: profile.id, actorName: profile.full_name, action: "ERP_RETRY", entity: "ecount_sync_jobs", entityId: jobId });
  const r = await processSyncQueue(5);
  revalidatePath("/admin/ecount");
  return { ok: true, ...r };
}

export async function requeueOrderAction(orderId: string) {
  await requireRole(ADMIN_ROLES);
  await queueOrderPush(orderId);
  const r = await processSyncQueue(5);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/ecount");
  return { ok: true, ...r };
}

export async function testEcountConnectionAction() {
  await requireRole(ADMIN_ROLES);
  const client = getEcountClient();
  const r = await client.testConnection();
  return { ...r, mode: client.mode };
}

export async function syncStocksAction() {
  await requireRole(STAFF_ROLES);
  const r = await syncStocks();
  revalidatePath("/admin/inventory");
  return { ok: true, ...r };
}

export async function setMockFailAction(fail: boolean) {
  await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  await admin.from("system_settings").upsert({ key: "mock_ecount.fail_next", value: fail });
  return { ok: true };
}

// ---------- 클레임 ----------

export async function updateClaimAction(claimId: string, status: string, adminNote?: string) {
  const profile = await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  const { data: claim } = await admin.from("claims").select("id, claim_no, status, store_id").eq("id", claimId).single();
  if (!claim) return { ok: false, error: "클레임을 찾을 수 없습니다." };
  const patch: Record<string, unknown> = { status, admin_note: adminNote ?? null };
  if (status === "RESOLVED") { patch.resolved_by = profile.id; patch.resolved_at = new Date().toISOString(); }
  await admin.from("claims").update(patch).eq("id", claimId);
  await auditLog({ actorId: profile.id, actorName: profile.full_name, action: "CLAIM_UPDATE", entity: "claims", entityId: claimId, before: { status: claim.status }, after: { status, adminNote } });
  await notifyStore(claim.store_id, "CLAIM", "클레임 처리 상태가 변경되었습니다", `${claim.claim_no}`, "/app/my/claims");
  revalidatePath("/admin/claims");
  return { ok: true };
}

// ---------- 공지 ----------

const annSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  isPinned: z.boolean(),
  isImportant: z.boolean(),
  endsAt: z.string().optional(),
  targetAll: z.boolean(),
  targetStoreIds: z.array(z.string().uuid()).optional(),
  targetBrandIds: z.array(z.string().uuid()).optional(),
});

export async function createAnnouncementAction(input: z.infer<typeof annSchema>) {
  const profile = await requireRole(ADMIN_ROLES);
  const parsed = annSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "입력값을 확인해주세요." };
  const admin = createAdminClient();
  const { data: ann, error } = await admin.from("announcements").insert({
    title: parsed.data.title, body: parsed.data.body,
    is_pinned: parsed.data.isPinned, is_important: parsed.data.isImportant,
    ends_at: parsed.data.endsAt || null, target_all: parsed.data.targetAll, created_by: profile.id,
  }).select("id").single();
  if (error || !ann) return { ok: false, error: "등록 실패" };
  if (!parsed.data.targetAll) {
    const targets = [
      ...(parsed.data.targetStoreIds ?? []).map((sid) => ({ announcement_id: ann.id, store_id: sid })),
      ...(parsed.data.targetBrandIds ?? []).map((bid) => ({ announcement_id: ann.id, brand_id: bid })),
    ];
    if (targets.length) await admin.from("announcement_targets").insert(targets);
  }
  revalidatePath("/admin/announcements");
  return { ok: true };
}

export async function deleteAnnouncementAction(id: string) {
  const profile = await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  await admin.from("announcements").delete().eq("id", id);
  await auditLog({ actorId: profile.id, actorName: profile.full_name, action: "ANNOUNCEMENT_DELETE", entity: "announcements", entityId: id });
  revalidatePath("/admin/announcements");
  return { ok: true };
}

// ---------- 사용자 ----------

const userSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(4).max(100).optional(), // 미입력 시 초기 비밀번호 1234
  fullName: z.string().min(1).max(50),
  role: z.enum(["super_admin", "hq_admin", "warehouse", "franchise_owner", "franchise_staff"]),
  storeId: z.string().uuid().optional(),
  phone: z.string().max(20).optional(),
});

export async function createUserAction(input: z.infer<typeof userSchema>) {
  const profile = await requireRole(ADMIN_ROLES);
  const parsed = userSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "입력값을 확인해주세요." };
  if (!isValidUsername(parsed.data.username)) return { ok: false, error: "아이디는 영문/숫자/._- 3~30자입니다." };
  // hq_admin은 super_admin 생성 불가
  if (profile.role !== "super_admin" && parsed.data.role === "super_admin") return { ok: false, error: "권한이 없습니다." };
  if (["franchise_owner", "franchise_staff"].includes(parsed.data.role) && !parsed.data.storeId) {
    return { ok: false, error: "가맹점 계정은 소속 가맹점을 선택해야 합니다." };
  }

  const admin = createAdminClient();
  const initialPassword = parsed.data.password ?? INITIAL_PASSWORD;
  const { data: created, error } = await admin.auth.admin.createUser({
    email: usernameToEmail(parsed.data.username),
    password: initialPassword,
    email_confirm: true,
    user_metadata: { must_change_password: true }, // 최초 로그인 시 비밀번호 변경 강제
  });
  if (error || !created.user) return { ok: false, error: `계정 생성 실패: ${error?.message ?? ""}` };
  const { error: pErr } = await admin.from("profiles").insert({
    id: created.user.id, username: normalizeUsername(parsed.data.username), full_name: parsed.data.fullName,
    role: parsed.data.role, store_id: parsed.data.storeId ?? null, phone: parsed.data.phone ?? null,
  });
  if (pErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { ok: false, error: `프로필 생성 실패: ${pErr.message}` };
  }
  await auditLog({ actorId: profile.id, actorName: profile.full_name, action: "USER_CREATE", entity: "profiles", entityId: created.user.id, after: { username: parsed.data.username, role: parsed.data.role } });
  revalidatePath("/admin/users");
  return { ok: true };
}

/** 비밀번호 초기화 — 초기값(1234)으로 리셋하고 다음 로그인 시 변경을 강제한다. */
export async function resetPasswordAction(userId: string, newPassword?: string) {
  const profile = await requireRole(ADMIN_ROLES);
  const password = newPassword || INITIAL_PASSWORD;
  const admin = createAdminClient();

  // Auth 서버는 비밀번호 변경 시 최소 6자를 강제하므로, 4자리 초기화는 DB 함수로 처리
  if (password.length < 6) {
    const { error } = await admin.rpc("admin_reset_password", { target: userId, new_password: password });
    if (error) {
      return {
        ok: false,
        error: `초기화 실패: ${error.message} — supabase/migrations/00002_reset_password.sql 이 적용되었는지 확인하세요.`,
      };
    }
  } else {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { must_change_password: true },
    });
    if (error) return { ok: false, error: error.message };
  }
  await auditLog({ actorId: profile.id, actorName: profile.full_name, action: "USER_PASSWORD_RESET", entity: "profiles", entityId: userId });
  return { ok: true };
}

export async function toggleUserActiveAction(userId: string, isActive: boolean) {
  const profile = await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  await admin.from("profiles").update({ is_active: isActive }).eq("id", userId);
  await auditLog({ actorId: profile.id, actorName: profile.full_name, action: "USER_TOGGLE", entity: "profiles", entityId: userId, after: { isActive } });
  revalidatePath("/admin/users");
  return { ok: true };
}

// ---------- 설정 ----------

export async function updateDeliveryRuleAction(input: {
  weekdayCutoff: string; allowSaturdayOrder: boolean; allowHolidayOrder: boolean;
  minLeadDays: number; allowSameDay: boolean; shipDays: number[];
}) {
  const profile = await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  const { data: rule } = await admin.from("delivery_rules").select("id").order("created_at").limit(1).single();
  if (!rule) return { ok: false, error: "배송 규칙이 없습니다." };
  await admin.from("delivery_rules").update({
    weekday_cutoff: input.weekdayCutoff, allow_saturday_order: input.allowSaturdayOrder,
    allow_holiday_order: input.allowHolidayOrder, min_lead_days: input.minLeadDays,
    allow_same_day: input.allowSameDay, ship_days: input.shipDays,
  }).eq("id", rule.id);
  await auditLog({ actorId: profile.id, actorName: profile.full_name, action: "DELIVERY_RULE_UPDATE", entity: "delivery_rules", entityId: rule.id, after: input });
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function addHolidayAction(date: string, name: string) {
  await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  const { error } = await admin.from("holidays").insert({ holiday_date: date, name: name || null });
  revalidatePath("/admin/settings");
  return { ok: !error, error: error?.message };
}

export async function removeHolidayAction(id: string) {
  await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  await admin.from("holidays").delete().eq("id", id);
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function setStockDisplayAction(mode: string) {
  const profile = await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  await admin.from("system_settings").upsert({ key: "public.stock_display", value: mode, updated_by: profile.id });
  revalidatePath("/admin/settings");
  return { ok: true };
}
