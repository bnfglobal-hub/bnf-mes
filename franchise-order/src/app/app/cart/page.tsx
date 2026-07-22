import { requireFranchise } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreCatalog, getCartLines } from "@/lib/franchise-data";
import { loadDeliveryRule, loadHolidays, nowKst } from "@/lib/domain/order-service";
import { calcShipDate, formatYmd } from "@/lib/domain/delivery-date";
import { CartView } from "@/components/franchise/cart-view";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const profile = await requireFranchise();
  const admin = createAdminClient();

  const [catalog, cartLines, { data: store }, { data: addresses }, rule, holidays] = await Promise.all([
    getStoreCatalog(profile.store_id),
    getCartLines(profile.store_id, profile.id),
    admin.from("stores").select("*").eq("id", profile.store_id).single(),
    admin.from("addresses").select("id, label, address1, address2, is_default").eq("store_id", profile.store_id).eq("is_active", true).order("is_default", { ascending: false }),
    loadDeliveryRule(),
    loadHolidays(),
  ]);

  const shipDate = calcShipDate(nowKst(), rule, {
    deliveryDays: store?.delivery_days ?? [1, 2, 3, 4, 5],
    orderCutoff: store?.order_cutoff?.slice(0, 5) ?? rule.weekdayCutoff,
  }, holidays);

  return (
    <main>
      <header className="px-4 pt-4">
        <h1 className="text-lg font-bold">장바구니</h1>
      </header>
      <CartView
        catalog={catalog}
        cartLines={cartLines}
        addresses={addresses ?? []}
        store={{
          minOrderAmount: Number(store?.min_order_amount ?? 0),
          minAmountBasis: (store?.min_amount_basis ?? "SUPPLY") as "SUPPLY" | "WITH_VAT",
          deliveryFee: Number(store?.delivery_fee ?? 0),
          freeDeliveryThreshold: store?.free_delivery_threshold != null ? Number(store.free_delivery_threshold) : null,
          orderBlocked: !!store?.order_blocked,
        }}
        plannedShipDate={formatYmd(shipDate)}
      />
    </main>
  );
}
