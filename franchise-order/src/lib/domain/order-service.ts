import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcLine, calcOrderTotals, checkMinOrderAmount, resolveUnitPrice, validateQty, type TaxType, type MinAmountBasis } from "./pricing";
import { calcShipDate, canOrderToday, formatYmd, type DeliveryRule } from "./delivery-date";
import { notifyAdmins, notifyStore } from "@/lib/notify";
import { queueOrderPush } from "@/lib/ecount/service";
import { auditLog } from "@/lib/audit";

export interface PlaceOrderInput {
  storeId: string;
  profileId: string;
  items: { productId: string; qty: number }[];
  memo?: string;
  requestedDeliveryDate?: string; // YYYY-MM-DD
  addressId?: string;
  clientRequestId: string; // 중복 제출 방지
  /** 관리자 대리주문 시 최소금액 예외 허용 */
  allowBelowMinimum?: boolean;
}

export interface PlaceOrderResult {
  ok: boolean;
  orderId?: string;
  orderNo?: string;
  plannedShipDate?: string;
  error?: string;
}

/** KST 현재시각 (서버 TZ 무관) */
export function nowKst(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

export async function loadDeliveryRule(): Promise<DeliveryRule> {
  const admin = createAdminClient();
  const { data } = await admin.from("delivery_rules").select("*").order("created_at").limit(1).single();
  return {
    weekdayCutoff: data?.weekday_cutoff?.slice(0, 5) ?? "15:00",
    allowSaturdayOrder: data?.allow_saturday_order ?? true,
    allowHolidayOrder: data?.allow_holiday_order ?? false,
    minLeadDays: data?.min_lead_days ?? 1,
    allowSameDay: data?.allow_same_day ?? false,
    shipDays: data?.ship_days ?? [1, 2, 3, 4, 5],
  };
}

export async function loadHolidays(): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("holidays").select("holiday_date").gte("holiday_date", new Date().toISOString().slice(0, 10));
  return (data ?? []).map((h) => h.holiday_date);
}

/**
 * 주문 생성 — 모든 값을 서버에서 재검증·재계산한다.
 * 클라이언트가 보낸 단가/합계는 신뢰하지 않는다.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const admin = createAdminClient();

  if (input.items.length === 0) return { ok: false, error: "주문할 상품이 없습니다." };

  // 1) 중복 제출 확인
  const { data: dup } = await admin
    .from("orders").select("id, order_no")
    .eq("store_id", input.storeId).eq("client_request_id", input.clientRequestId)
    .maybeSingle();
  if (dup) return { ok: true, orderId: dup.id, orderNo: dup.order_no }; // 멱등 응답

  // 2) 가맹점 상태
  const { data: store } = await admin.from("stores").select("*").eq("id", input.storeId).single();
  if (!store || !store.is_active) return { ok: false, error: "사용할 수 없는 가맹점입니다." };
  if (store.order_blocked) return { ok: false, error: "주문이 차단된 가맹점입니다. 본사에 문의하세요." };

  // 3) 주문 가능 시각/요일
  const rule = await loadDeliveryRule();
  const holidays = await loadHolidays();
  const now = nowKst();
  const orderable = canOrderToday(now, rule, holidays);
  if (!orderable.ok && !input.allowBelowMinimum) return { ok: false, error: orderable.reason };

  // 4) 품목 검증 + 서버 단가 재계산
  const productIds = input.items.map((i) => i.productId);
  const { data: sps } = await admin
    .from("store_products")
    .select("*, products(*)")
    .eq("store_id", input.storeId)
    .in("product_id", productIds);
  const spMap = new Map((sps ?? []).map((sp) => [sp.product_id, sp]));

  const today = formatYmd(now);
  const { data: prices } = await admin
    .from("store_prices")
    .select("product_id, price, valid_from, valid_to")
    .eq("store_id", input.storeId)
    .in("product_id", productIds)
    .lte("valid_from", today)
    .or(`valid_to.is.null,valid_to.gte.${today}`)
    .order("valid_from", { ascending: false });
  const priceMap = new Map<string, number>();
  for (const p of prices ?? []) if (!priceMap.has(p.product_id)) priceMap.set(p.product_id, Number(p.price));

  // 공산품(전 거래처 공용)은 가맹점 매핑 없이 주문 가능
  const unmappedIds = input.items.filter((i) => !spMap.has(i.productId)).map((i) => i.productId);
  const generalMap = new Map(); // 품목 row (supabase 미타입 결과)
  if (unmappedIds.length > 0) {
    const { data: generals } = await admin.from("products").select("*").in("id", unmappedIds).eq("is_general", true);
    for (const g of generals ?? []) generalMap.set(g.id, g);
  }

  const lines: { productId: string; qty: number; unitPrice: number; taxType: TaxType; snapshot: object; supply: number; vat: number }[] = [];
  for (const item of input.items) {
    const sp = spMap.get(item.productId);
    const general = generalMap.get(item.productId);
    if ((!sp || !sp.is_visible) && !general) return { ok: false, error: "취급하지 않는 상품이 포함되어 있습니다." };
    const p = sp?.products ?? general;
    if (!p || !p.is_active || p.is_discontinued) return { ok: false, error: `판매 중지된 상품입니다: ${p?.name ?? item.productId}` };
    if (p.is_soldout || sp?.is_soldout) return { ok: false, error: `품절된 상품입니다: ${p.name}` };
    // 적용 기간 (취급상품 매핑에만 해당)
    if (sp?.valid_from && sp.valid_from > today) return { ok: false, error: `아직 주문할 수 없는 상품입니다: ${p.name}` };
    if (sp?.valid_to && sp.valid_to < today) return { ok: false, error: `취급 종료된 상품입니다: ${p.name}` };

    const qtyCheck = validateQty(item.qty, {
      minQty: sp?.min_order_qty ?? p.min_order_qty,
      maxQty: sp?.max_order_qty ?? p.max_order_qty,
      step: sp?.qty_step ?? p.qty_step,
    });
    if (!qtyCheck.ok) return { ok: false, error: `${p.name}: ${qtyCheck.message}` };

    const unitPrice = resolveUnitPrice({
      basePrice: Number(p.base_price),
      customPrice: sp?.custom_price != null ? Number(sp.custom_price) : null,
      discountRate: sp?.discount_rate != null ? Number(sp.discount_rate) : null,
      periodPrice: priceMap.get(item.productId) ?? null,
    });
    const amounts = calcLine({ qty: item.qty, unitPrice, taxType: p.tax_type as TaxType });
    lines.push({
      productId: item.productId, qty: item.qty, unitPrice, taxType: p.tax_type as TaxType,
      supply: amounts.supplyAmount, vat: amounts.vatAmount,
      snapshot: {
        name: p.name, spec: p.spec, ecount_item_code: p.ecount_item_code,
        storage_type: p.storage_type, order_unit: p.order_unit, tax_type: p.tax_type,
      },
    });
  }

  // 5) 합계·배송비·최소금액
  const totals = calcOrderTotals(
    lines.map((l) => ({ qty: l.qty, unitPrice: l.unitPrice, taxType: l.taxType })),
    {
      deliveryFee: Number(store.delivery_fee),
      freeDeliveryThreshold: store.free_delivery_threshold != null ? Number(store.free_delivery_threshold) : null,
      basis: store.min_amount_basis as MinAmountBasis,
    }
  );
  const minCheck = checkMinOrderAmount(totals, Number(store.min_order_amount), store.min_amount_basis as MinAmountBasis);
  if (!minCheck.ok && !input.allowBelowMinimum) {
    return { ok: false, error: `최소 주문금액 ${Number(store.min_order_amount).toLocaleString()}원까지 ${minCheck.shortage.toLocaleString()}원 남았습니다.` };
  }

  // 6) 배송지 스냅샷
  let shipTo: object = {
    postal_code: store.postal_code, address1: store.address1, address2: store.address2,
    receiver: store.manager_name ?? store.name, phone: store.phone, delivery_note: store.delivery_note,
  };
  if (input.addressId) {
    const { data: addr } = await admin.from("addresses").select("*").eq("id", input.addressId).eq("store_id", input.storeId).single();
    if (addr) shipTo = {
      postal_code: addr.postal_code, address1: addr.address1, address2: addr.address2,
      receiver: addr.receiver, phone: addr.phone, delivery_note: addr.delivery_note,
    };
  }

  // 7) 출고 예정일
  const shipDate = calcShipDate(now, rule, {
    deliveryDays: store.delivery_days ?? [1, 2, 3, 4, 5],
    orderCutoff: store.order_cutoff?.slice(0, 5) ?? rule.weekdayCutoff,
  }, holidays);
  const plannedShipDate = formatYmd(shipDate);

  // 8) 주문번호 발급 + 저장
  const { data: orderNoData, error: fnError } = await admin.rpc("next_order_no");
  if (fnError || !orderNoData) return { ok: false, error: "주문번호 생성에 실패했습니다." };
  const orderNo = orderNoData as string;

  const { data: order, error: orderError } = await admin.from("orders").insert({
    order_no: orderNo,
    store_id: input.storeId,
    ecount_customer_code: store.ecount_customer_code,
    requested_delivery_date: input.requestedDeliveryDate ?? null,
    planned_ship_date: plannedShipDate,
    warehouse_id: store.default_warehouse_id,
    supply_amount: totals.supplyAmount,
    vat_amount: totals.vatAmount,
    delivery_fee: totals.deliveryFee,
    total_amount: totals.totalAmount,
    memo: input.memo ?? null,
    ship_to: shipTo,
    status: "PENDING",
    erp_status: "NOT_READY",
    client_request_id: input.clientRequestId,
    created_by: input.profileId,
  }).select("id, order_no").single();
  if (orderError || !order) {
    // unique 충돌 = 동시 중복 제출 → 기존 주문 반환
    const { data: existing } = await admin.from("orders").select("id, order_no")
      .eq("store_id", input.storeId).eq("client_request_id", input.clientRequestId).maybeSingle();
    if (existing) return { ok: true, orderId: existing.id, orderNo: existing.order_no };
    return { ok: false, error: "주문 저장에 실패했습니다. 다시 시도해주세요." };
  }

  await admin.from("order_items").insert(lines.map((l) => ({
    order_id: order.id, product_id: l.productId, product_snapshot: l.snapshot,
    qty: l.qty, unit_price: l.unitPrice, supply_amount: l.supply, vat_amount: l.vat,
  })));

  // 9) 재고 예약
  await admin.from("inventory_reservations").insert(lines.map((l) => ({
    order_id: order.id, product_id: l.productId, warehouse_id: store.default_warehouse_id, qty: l.qty,
  })));

  await admin.from("order_status_histories").insert({
    order_id: order.id, from_status: null, to_status: "PENDING", changed_by: input.profileId,
  });

  // 10) 장바구니 비우기
  const { data: cart } = await admin.from("carts").select("id").eq("store_id", input.storeId).eq("profile_id", input.profileId).maybeSingle();
  if (cart) await admin.from("cart_items").delete().eq("cart_id", cart.id);

  await notifyAdmins("ORDER_PLACED", `새 발주 접수: ${store.name}`, `${orderNo} · ${totals.totalAmount.toLocaleString()}원`, `/admin/orders/${order.id}`);
  await auditLog({ actorId: input.profileId, action: "ORDER_CREATE", entity: "orders", entityId: order.id, after: { orderNo, total: totals.totalAmount } });

  return { ok: true, orderId: order.id, orderNo: order.order_no, plannedShipDate };
}

// ---------------- 상태 전이 ----------------

const TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["PICKING", "SHIPPED", "CANCELLED"],
  PICKING: ["PICKED", "CANCELLED"],
  PICKED: ["SHIPPED", "PARTIALLY_SHIPPED"],
  SHIPPED: ["DELIVERED"],
  PARTIALLY_SHIPPED: ["SHIPPED", "DELIVERED"],
  CANCEL_REQUESTED: ["CANCELLED", "CONFIRMED", "PENDING"],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED: [],
  DRAFT: ["PENDING"],
};

export function canTransition(from: string, to: string): boolean {
  if (from === "PENDING" && to === "CANCEL_REQUESTED") return true;
  return (TRANSITIONS[from] ?? []).includes(to);
}

export async function changeOrderStatus(args: {
  orderId: string;
  toStatus: string;
  actorId: string;
  actorName?: string;
  reason?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("id, order_no, status, store_id, stores(name)").eq("id", args.orderId).single();
  if (!order) return { ok: false, error: "주문을 찾을 수 없습니다." };
  if (!canTransition(order.status, args.toStatus)) {
    return { ok: false, error: `'${order.status}' 상태에서 '${args.toStatus}' 로 변경할 수 없습니다.` };
  }

  const patch: Record<string, unknown> = { status: args.toStatus };
  if (args.toStatus === "CONFIRMED") { patch.confirmed_by = args.actorId; patch.confirmed_at = new Date().toISOString(); }
  if (args.toStatus === "SHIPPED") patch.shipped_at = new Date().toISOString();
  if (args.toStatus === "DELIVERED") patch.delivered_at = new Date().toISOString();
  if (args.toStatus === "CANCELLED" || args.toStatus === "REJECTED") {
    patch.cancelled_by = args.actorId; patch.cancelled_at = new Date().toISOString();
  }

  await admin.from("orders").update(patch).eq("id", args.orderId);
  await admin.from("order_status_histories").insert({
    order_id: args.orderId, from_status: order.status, to_status: args.toStatus,
    changed_by: args.actorId, reason: args.reason ?? null,
  });
  await auditLog({
    actorId: args.actorId, actorName: args.actorName, action: "ORDER_STATUS",
    entity: "orders", entityId: args.orderId,
    before: { status: order.status }, after: { status: args.toStatus, reason: args.reason },
  });

  // 취소/반려 시 재고 예약 해제
  if (["CANCELLED", "REJECTED"].includes(args.toStatus)) {
    await admin.from("inventory_reservations").update({ released: true }).eq("order_id", args.orderId);
  }

  // 확정 시 ERP 큐 등록
  if (args.toStatus === "CONFIRMED") {
    await queueOrderPush(args.orderId);
  }

  // 가맹점 알림
  const notifyMap: Record<string, { type: "ORDER_CONFIRMED" | "ORDER_REJECTED" | "ORDER_CANCELLED" | "SHIPPED" | "DELIVERED"; title: string }> = {
    CONFIRMED: { type: "ORDER_CONFIRMED", title: "주문이 확정되었습니다" },
    REJECTED: { type: "ORDER_REJECTED", title: "주문이 반려되었습니다" },
    CANCELLED: { type: "ORDER_CANCELLED", title: "주문이 취소되었습니다" },
    SHIPPED: { type: "SHIPPED", title: "상품이 출고되었습니다" },
    DELIVERED: { type: "DELIVERED", title: "배송이 완료되었습니다" },
  };
  const n = notifyMap[args.toStatus];
  if (n) await notifyStore(order.store_id, n.type, n.title, order.order_no, `/app/orders/${args.orderId}`);

  return { ok: true };
}
