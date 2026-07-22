import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUnitPrice, calcAvailableStock, displayStock, type StockDisplayMode, type TaxType } from "@/lib/domain/pricing";
import { formatYmd } from "@/lib/domain/delivery-date";
import { nowKst } from "@/lib/domain/order-service";

export interface CatalogItem {
  productId: string;
  name: string;
  spec: string | null;
  ecountItemCode: string | null;
  storageType: "ROOM" | "CHILLED" | "FROZEN";
  taxType: TaxType;
  categoryId: string | null;
  categoryName: string | null;
  unitPrice: number;
  orderUnit: string;
  minQty: number;
  maxQty: number | null;
  qtyStep: number;
  boxQty: number | null;
  thumbnailUrl: string | null;
  isSoldout: boolean;
  isNew: boolean;
  isRecommended: boolean;
  stockLabel: string | null;
  sortOrder: number;
}

/** 가맹점 카탈로그 — 매핑된 상품만, 가맹점 단가/재고정책 적용 (서버 전용) */
export async function getStoreCatalog(storeId: string): Promise<CatalogItem[]> {
  const admin = createAdminClient();
  const today = formatYmd(nowKst());

  const [{ data: sps }, { data: setting }, { data: prices }] = await Promise.all([
    admin.from("store_products")
      .select("*, products(*, product_categories(id, name))")
      .eq("store_id", storeId).eq("is_visible", true)
      .order("sort_order"),
    admin.from("system_settings").select("value").eq("key", "public.stock_display").maybeSingle(),
    admin.from("store_prices").select("product_id, price, valid_from, valid_to")
      .eq("store_id", storeId).lte("valid_from", today)
      .or(`valid_to.is.null,valid_to.gte.${today}`)
      .order("valid_from", { ascending: false }),
  ]);

  const defaultMode = ((setting?.value as string) ?? "LEVEL") as StockDisplayMode;
  const priceMap = new Map<string, number>();
  for (const p of prices ?? []) if (!priceMap.has(p.product_id)) priceMap.set(p.product_id, Number(p.price));

  const productIds = (sps ?? []).map((sp) => sp.product_id);
  const [{ data: stocks }, { data: reservations }] = await Promise.all([
    admin.from("inventory_snapshots").select("product_id, qty, safety_qty").in("product_id", productIds.length ? productIds : ["00000000-0000-0000-0000-000000000000"]),
    admin.from("inventory_reservations").select("product_id, qty").eq("released", false).in("product_id", productIds.length ? productIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);
  const stockMap = new Map<string, { qty: number; safety: number }>();
  for (const s of stocks ?? []) {
    const cur = stockMap.get(s.product_id) ?? { qty: 0, safety: 0 };
    stockMap.set(s.product_id, { qty: cur.qty + Number(s.qty), safety: cur.safety + Number(s.safety_qty) });
  }
  const resvMap = new Map<string, number>();
  for (const r of reservations ?? []) resvMap.set(r.product_id, (resvMap.get(r.product_id) ?? 0) + Number(r.qty));

  const items: CatalogItem[] = [];
  for (const sp of sps ?? []) {
    const p = sp.products;
    if (!p || !p.is_active || p.is_discontinued) continue;
    if (sp.valid_from && sp.valid_from > today) continue;
    if (sp.valid_to && sp.valid_to < today) continue;
    const mode = (p.stock_display as StockDisplayMode | null) ?? defaultMode;
    const st = stockMap.get(p.id);
    const available = st ? calcAvailableStock(st.qty, resvMap.get(p.id) ?? 0, st.safety) : 0;
    const soldout = p.is_soldout || sp.is_soldout;
    items.push({
      productId: p.id,
      name: p.name,
      spec: p.spec,
      ecountItemCode: p.ecount_item_code,
      storageType: p.storage_type,
      taxType: p.tax_type,
      categoryId: p.product_categories?.id ?? null,
      categoryName: p.product_categories?.name ?? null,
      unitPrice: resolveUnitPrice({
        basePrice: Number(p.base_price),
        customPrice: sp.custom_price != null ? Number(sp.custom_price) : null,
        discountRate: sp.discount_rate != null ? Number(sp.discount_rate) : null,
        periodPrice: priceMap.get(p.id) ?? null,
      }),
      orderUnit: p.order_unit,
      minQty: sp.min_order_qty ?? p.min_order_qty,
      maxQty: sp.max_order_qty ?? p.max_order_qty,
      qtyStep: sp.qty_step ?? p.qty_step,
      boxQty: p.box_qty,
      thumbnailUrl: p.thumbnail_url,
      isSoldout: soldout,
      isNew: p.is_new,
      isRecommended: p.is_recommended,
      stockLabel: soldout ? "품절" : st ? displayStock(available, mode) : null,
      sortOrder: sp.sort_order || p.sort_order,
    });
  }
  return items.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ko"));
}

export interface CartLine {
  productId: string;
  qty: number;
}

export async function getCartLines(storeId: string, profileId: string): Promise<CartLine[]> {
  const admin = createAdminClient();
  const { data: cart } = await admin.from("carts").select("id, cart_items(product_id, qty)").eq("store_id", storeId).eq("profile_id", profileId).maybeSingle();
  return (cart?.cart_items ?? []).map((ci: { product_id: string; qty: number }) => ({ productId: ci.product_id, qty: ci.qty }));
}

/** 최근 N개 주문에서 자주 주문한 상품 productId 목록 */
export async function getFrequentProductIds(storeId: string, limit = 8): Promise<string[]> {
  const admin = createAdminClient();
  const { data: orders } = await admin.from("orders").select("id").eq("store_id", storeId)
    .not("status", "in", "(CANCELLED,REJECTED,DRAFT)").order("ordered_at", { ascending: false }).limit(20);
  if (!orders?.length) return [];
  const { data: items } = await admin.from("order_items").select("product_id").in("order_id", orders.map((o) => o.id));
  const counts = new Map<string, number>();
  for (const it of items ?? []) counts.set(it.product_id, (counts.get(it.product_id) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
}
