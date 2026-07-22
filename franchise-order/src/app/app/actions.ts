"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFranchise } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { placeOrder } from "@/lib/domain/order-service";
import { rateLimit } from "@/lib/rate-limit";
import { notifyAdmins } from "@/lib/notify";

async function getOrCreateCartId(storeId: string, profileId: string): Promise<string> {
  const admin = createAdminClient();
  const { data: existing } = await admin.from("carts").select("id").eq("store_id", storeId).eq("profile_id", profileId).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await admin.from("carts").insert({ store_id: storeId, profile_id: profileId }).select("id").single();
  if (error || !created) throw new Error("장바구니 생성 실패");
  return created.id;
}

const setItemSchema = z.object({ productId: z.string().uuid(), qty: z.number().int().min(0).max(9999) });

export async function setCartItemAction(productId: string, qty: number): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireFranchise();
  const parsed = setItemSchema.safeParse({ productId, qty });
  if (!parsed.success) return { ok: false, error: "잘못된 요청입니다." };

  const admin = createAdminClient();
  // 취급상품 또는 공산품만 담기 가능 (URL 조작 방어)
  const { data: sp } = await admin.from("store_products").select("id").eq("store_id", profile.store_id).eq("product_id", productId).eq("is_visible", true).maybeSingle();
  if (!sp) {
    const { data: general } = await admin.from("products").select("id").eq("id", productId).eq("is_general", true).eq("is_active", true).maybeSingle();
    if (!general) return { ok: false, error: "취급하지 않는 상품입니다." };
  }

  const cartId = await getOrCreateCartId(profile.store_id, profile.id);
  if (qty === 0) {
    await admin.from("cart_items").delete().eq("cart_id", cartId).eq("product_id", productId);
  } else {
    await admin.from("cart_items").upsert({ cart_id: cartId, product_id: productId, qty }, { onConflict: "cart_id,product_id" });
  }
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function clearCartAction(): Promise<void> {
  const profile = await requireFranchise();
  const admin = createAdminClient();
  const { data: cart } = await admin.from("carts").select("id").eq("store_id", profile.store_id).eq("profile_id", profile.id).maybeSingle();
  if (cart) await admin.from("cart_items").delete().eq("cart_id", cart.id);
  revalidatePath("/app", "layout");
}

const placeSchema = z.object({
  memo: z.string().max(500).optional(),
  requestedDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  addressId: z.string().uuid().optional(),
  clientRequestId: z.string().min(8).max(64),
});

export async function placeOrderAction(input: {
  memo?: string;
  requestedDeliveryDate?: string;
  addressId?: string;
  clientRequestId: string;
}): Promise<{ ok: boolean; orderNo?: string; orderId?: string; plannedShipDate?: string; error?: string }> {
  const profile = await requireFranchise();
  const parsed = placeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "요청 값이 올바르지 않습니다." };

  const rl = rateLimit(`order:${profile.id}`, 5, 60_000);
  if (!rl.ok) return { ok: false, error: "주문 요청이 너무 잦습니다. 잠시 후 다시 시도해주세요." };

  const admin = createAdminClient();
  const { data: cart } = await admin.from("carts").select("id, cart_items(product_id, qty)").eq("store_id", profile.store_id).eq("profile_id", profile.id).maybeSingle();
  const items = (cart?.cart_items ?? []).map((ci: { product_id: string; qty: number }) => ({ productId: ci.product_id, qty: ci.qty }));
  if (items.length === 0) return { ok: false, error: "장바구니가 비어 있습니다." };

  const result = await placeOrder({
    storeId: profile.store_id,
    profileId: profile.id,
    items,
    memo: parsed.data.memo,
    requestedDeliveryDate: parsed.data.requestedDeliveryDate,
    addressId: parsed.data.addressId,
    clientRequestId: parsed.data.clientRequestId,
  });
  if (result.ok) revalidatePath("/app", "layout");
  return result;
}

/** 이전 주문 다시 담기 */
export async function reorderAction(orderId: string): Promise<{ ok: boolean; added: number; skipped: number; error?: string }> {
  const profile = await requireFranchise();
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("id, store_id, order_items(product_id, qty)").eq("id", orderId).single();
  if (!order || order.store_id !== profile.store_id) return { ok: false, added: 0, skipped: 0, error: "주문을 찾을 수 없습니다." };

  const { data: sps } = await admin.from("store_products").select("product_id, is_soldout, products(is_active, is_soldout, is_discontinued)")
    .eq("store_id", profile.store_id).eq("is_visible", true)
    .in("product_id", order.order_items.map((i: { product_id: string }) => i.product_id));
  const available = new Set(
    (sps ?? []).filter((sp) => {
      const p = sp.products as unknown as { is_active: boolean; is_soldout: boolean; is_discontinued: boolean } | null;
      return p && p.is_active && !p.is_soldout && !p.is_discontinued && !sp.is_soldout;
    }).map((sp) => sp.product_id)
  );
  // 공산품도 다시 담기 허용
  const missingIds = (order.order_items as { product_id: string }[]).map((i) => i.product_id).filter((id) => !available.has(id));
  if (missingIds.length > 0) {
    const { data: generals } = await admin.from("products").select("id")
      .in("id", missingIds).eq("is_general", true).eq("is_active", true).eq("is_soldout", false).eq("is_discontinued", false);
    for (const g of generals ?? []) available.add(g.id);
  }

  const cartId = await getOrCreateCartId(profile.store_id, profile.id);
  let added = 0, skipped = 0;
  for (const item of order.order_items as { product_id: string; qty: number }[]) {
    if (!available.has(item.product_id)) { skipped++; continue; }
    await admin.from("cart_items").upsert({ cart_id: cartId, product_id: item.product_id, qty: item.qty }, { onConflict: "cart_id,product_id" });
    added++;
  }
  revalidatePath("/app", "layout");
  return { ok: true, added, skipped };
}

/** 주문 취소 요청 (PENDING 상태만) */
export async function requestCancelAction(orderId: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireFranchise();
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("id, order_no, status, store_id").eq("id", orderId).single();
  if (!order || order.store_id !== profile.store_id) return { ok: false, error: "주문을 찾을 수 없습니다." };
  if (!["PENDING", "CONFIRMED"].includes(order.status)) return { ok: false, error: "이 상태에서는 취소 요청할 수 없습니다. 본사에 문의하세요." };

  await admin.from("orders").update({ status: "CANCEL_REQUESTED" }).eq("id", orderId);
  await admin.from("order_status_histories").insert({
    order_id: orderId, from_status: order.status, to_status: "CANCEL_REQUESTED", changed_by: profile.id, reason: reason || null,
  });
  await notifyAdmins("ORDER_CANCELLED", "주문 취소 요청", `${order.order_no}${reason ? ` — ${reason}` : ""}`, `/admin/orders/${orderId}`);
  revalidatePath("/app/orders");
  return { ok: true };
}

const claimSchema = z.object({
  orderId: z.string().uuid(),
  claimType: z.enum(["NOT_DELIVERED", "WRONG_ITEM", "SHORTAGE", "DAMAGED", "THAWED", "QUALITY", "EXPIRY", "OTHER"]),
  resolution: z.enum(["REDELIVERY", "RETURN", "REFUND", "NEGOTIATE"]),
  reason: z.string().min(1).max(200),
  detail: z.string().max(2000).optional(),
  items: z.array(z.object({ orderItemId: z.string().uuid(), qty: z.number().int().min(1) })).min(1),
});

export async function createClaimAction(input: z.infer<typeof claimSchema>): Promise<{ ok: boolean; claimNo?: string; error?: string }> {
  const profile = await requireFranchise();
  const parsed = claimSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "입력값을 확인해주세요." };

  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("id, order_no, store_id, order_items(id, product_id)").eq("id", parsed.data.orderId).single();
  if (!order || order.store_id !== profile.store_id) return { ok: false, error: "주문을 찾을 수 없습니다." };
  const validItemIds = new Set((order.order_items as { id: string }[]).map((i) => i.id));
  for (const it of parsed.data.items) {
    if (!validItemIds.has(it.orderItemId)) return { ok: false, error: "주문에 없는 상품이 포함되어 있습니다." };
  }

  const claimNo = `CLM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const { data: claim, error } = await admin.from("claims").insert({
    claim_no: claimNo, order_id: order.id, store_id: profile.store_id,
    claim_type: parsed.data.claimType, resolution: parsed.data.resolution,
    reason: parsed.data.reason, detail: parsed.data.detail ?? null, created_by: profile.id,
  }).select("id").single();
  if (error || !claim) return { ok: false, error: "클레임 등록에 실패했습니다." };

  const itemMap = new Map((order.order_items as { id: string; product_id: string }[]).map((i) => [i.id, i.product_id]));
  await admin.from("claim_items").insert(parsed.data.items.map((it) => ({
    claim_id: claim.id, order_item_id: it.orderItemId, product_id: itemMap.get(it.orderItemId), qty: it.qty,
  })));
  await notifyAdmins("CLAIM", "새 클레임 접수", `${order.order_no} · ${parsed.data.reason}`, `/admin/claims`);
  revalidatePath("/app/orders");
  return { ok: true, claimNo };
}

export async function markNotificationReadAction(notificationId: string): Promise<void> {
  const profile = await requireFranchise();
  const admin = createAdminClient();
  await admin.from("notifications").update({ is_read: true }).eq("id", notificationId).eq("profile_id", profile.id);
}

export async function markAnnouncementReadAction(announcementId: string): Promise<void> {
  const profile = await requireFranchise();
  const admin = createAdminClient();
  await admin.from("announcement_reads").upsert({ announcement_id: announcementId, profile_id: profile.id });
}
