import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShipmentForm, DeliveredButton } from "@/components/admin/shipment-form";

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  await requireRole(STAFF_ROLES);
  const admin = createAdminClient();

  const [{ data: ready }, { data: shipped }] = await Promise.all([
    admin.from("orders")
      .select("id, order_no, planned_ship_date, total_amount, stores(name, delivery_zone), order_items(qty, shipped_qty)")
      .in("status", ["PICKED", "PARTIALLY_SHIPPED"]).order("planned_ship_date"),
    admin.from("orders")
      .select("id, order_no, status, shipped_at, total_amount, stores(name), shipments(driver_name, tracking_no, departed_at)")
      .eq("status", "SHIPPED").order("shipped_at", { ascending: false }).limit(30),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold">출고·배송</h1>

      <Card className="mt-4">
        <CardHeader><CardTitle>출고 대기 (피킹 완료)</CardTitle></CardHeader>
        <CardContent>
          {(ready ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">출고 대기 주문이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {(ready ?? []).map((o) => {
                const items = o.order_items as { qty: number; shipped_qty: number }[];
                const shortage = items.some((i) => (i.shipped_qty || i.qty) < i.qty);
                return (
                  <div key={o.id} className="rounded-xl border border-border p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold">{o.order_no} <span className="ml-1 font-normal text-muted">{(o.stores as { name?: string } | null)?.name}</span></p>
                        <p className="text-xs text-muted">
                          출고예정 {o.planned_ship_date} · {formatNumber(Number(o.total_amount))}원
                          {(o.stores as { delivery_zone?: string } | null)?.delivery_zone ? ` · ${(o.stores as { delivery_zone?: string }).delivery_zone}권역` : ""}
                          {shortage && <span className="ml-1 font-semibold text-amber-600">· 부분출고 (수량 부족)</span>}
                        </p>
                      </div>
                      <ShipmentForm orderId={o.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>출고 완료 (배송 중)</CardTitle></CardHeader>
        <CardContent>
          {(shipped ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">배송 중인 주문이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead><tr className="border-b border-border text-left text-xs text-muted">
                  <th className="py-2 pr-3">주문번호</th><th className="py-2 pr-3">가맹점</th><th className="py-2 pr-3">출고일시</th>
                  <th className="py-2 pr-3">기사/운송장</th><th className="py-2 pr-3">상태</th><th className="py-2"></th>
                </tr></thead>
                <tbody>
                  {(shipped ?? []).map((o) => {
                    const sh = (o.shipments as { driver_name?: string; tracking_no?: string }[])[0];
                    return (
                      <tr key={o.id} className="border-b border-gray-50">
                        <td className="py-2 pr-3 font-semibold">{o.order_no}</td>
                        <td className="py-2 pr-3">{(o.stores as { name?: string } | null)?.name}</td>
                        <td className="py-2 pr-3 text-gray-600">{formatDateTime(o.shipped_at)}</td>
                        <td className="py-2 pr-3 text-gray-600">{sh?.driver_name ?? "-"} {sh?.tracking_no ? `/ ${sh.tracking_no}` : ""}</td>
                        <td className="py-2 pr-3"><Badge className={ORDER_STATUS_COLOR[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge></td>
                        <td className="py-2 text-right"><DeliveredButton orderId={o.id} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
