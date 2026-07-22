import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNumber } from "@/lib/utils";
import { STORAGE_LABEL, STORAGE_COLOR, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PickingControls, PickedQtyInput, PrintButton } from "@/components/admin/picking-controls";

export const dynamic = "force-dynamic";

export default async function PickingPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requireRole(STAFF_ROLES);
  const sp = await searchParams;
  const date = sp.date ?? new Date().toISOString().slice(0, 10);
  const admin = createAdminClient();

  const { data: orders } = await admin
    .from("orders")
    .select("id, order_no, status, planned_ship_date, stores(name, delivery_zone), warehouses(name), order_items(id, qty, shipped_qty, product_snapshot)")
    .eq("planned_ship_date", date)
    .in("status", ["CONFIRMED", "PICKING", "PICKED"])
    .order("order_no");

  // 품목별 합산
  const agg = new Map<string, { name: string; spec: string; storage: string; unit: string; total: number; picked: number }>();
  for (const o of orders ?? []) {
    for (const it of o.order_items as { qty: number; shipped_qty: number; product_snapshot: { name: string; spec?: string; storage_type?: string; order_unit?: string; ecount_item_code?: string } }[]) {
      const key = it.product_snapshot.ecount_item_code ?? it.product_snapshot.name;
      const cur = agg.get(key) ?? { name: it.product_snapshot.name, spec: it.product_snapshot.spec ?? "", storage: it.product_snapshot.storage_type ?? "ROOM", unit: it.product_snapshot.order_unit ?? "EA", total: 0, picked: 0 };
      cur.total += it.qty;
      cur.picked += it.shipped_qty;
      agg.set(key, cur);
    }
  }
  const aggByStorage: Record<string, { name: string; spec: string; unit: string; total: number; picked: number }[]> = {};
  for (const v of agg.values()) (aggByStorage[v.storage] ??= []).push(v);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-xl font-bold">피킹관리</h1>
        <div className="flex items-center gap-2">
          <form method="get" className="flex items-center gap-2">
            <input type="date" name="date" defaultValue={date} className="h-10 rounded-lg border border-border bg-white px-2 text-sm" />
            <button className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white">조회</button>
          </form>
          <PrintButton />
        </div>
      </div>

      <p className="mt-2 hidden text-lg font-bold print:block">피킹리스트 — 출고일 {date}</p>

      {(orders ?? []).length === 0 ? (
        <p className="mt-10 rounded-2xl border border-border bg-white py-16 text-center text-gray-400">
          {date} 출고 예정인 확정 주문이 없습니다.
        </p>
      ) : (
        <>
          {/* 품목별 합산 피킹리스트 */}
          <Card className="mt-4">
            <CardHeader><CardTitle>품목별 합산 (보관구분별)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-3">
                {(["FROZEN", "CHILLED", "ROOM"] as const).map((st) => (
                  <div key={st}>
                    <Badge className={STORAGE_COLOR[st]}>{STORAGE_LABEL[st]}</Badge>
                    <table className="mt-2 w-full text-sm">
                      <thead><tr className="border-b border-border text-left text-xs text-muted"><th className="py-1.5">품목</th><th className="py-1.5 text-right">필요</th><th className="py-1.5 text-right">피킹</th></tr></thead>
                      <tbody>
                        {(aggByStorage[st] ?? []).length === 0 && <tr><td colSpan={3} className="py-3 text-center text-xs text-gray-300">없음</td></tr>}
                        {(aggByStorage[st] ?? []).map((v, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="py-1.5">{v.name} <span className="text-xs text-muted">{v.spec}</span></td>
                            <td className="py-1.5 text-right font-bold">{formatNumber(v.total)}</td>
                            <td className={`py-1.5 text-right ${v.picked < v.total ? "text-amber-600" : "text-success"}`}>{formatNumber(v.picked)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 가맹점별 피킹 */}
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {(orders ?? []).map((o) => (
              <Card key={o.id} className="break-inside-avoid">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{(o.stores as { name?: string } | null)?.name} <span className="ml-1 text-xs font-normal text-muted">{o.order_no}</span></CardTitle>
                    <p className="mt-0.5 text-xs text-muted">{(o.warehouses as { name?: string } | null)?.name ?? "창고 미지정"}{(o.stores as { delivery_zone?: string } | null)?.delivery_zone ? ` · ${(o.stores as { delivery_zone?: string }).delivery_zone}권역` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={ORDER_STATUS_COLOR[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                    <span className="print:hidden"><PickingControls orderId={o.id} status={o.status} /></span>
                  </div>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-left text-xs text-muted"><th className="py-1.5">품목</th><th className="py-1.5 text-right">주문</th><th className="py-1.5 text-right">피킹수량</th></tr></thead>
                    <tbody>
                      {(o.order_items as { id: string; qty: number; shipped_qty: number; product_snapshot: { name: string; spec?: string; storage_type?: string } }[]).map((it) => (
                        <tr key={it.id} className="border-b border-gray-50">
                          <td className="py-1.5">
                            <Badge className={STORAGE_COLOR[it.product_snapshot.storage_type ?? "ROOM"]}>{STORAGE_LABEL[it.product_snapshot.storage_type ?? "ROOM"]}</Badge>
                            <span className="ml-1.5 font-medium">{it.product_snapshot.name}</span>
                            <span className="ml-1 text-xs text-muted">{it.product_snapshot.spec}</span>
                          </td>
                          <td className="py-1.5 text-right font-bold">{it.qty}</td>
                          <td className="py-1.5 text-right">
                            <span className="print:hidden"><PickedQtyInput orderItemId={it.id} qty={it.qty} shippedQty={it.shipped_qty} disabled={o.status === "PICKED"} /></span>
                            <span className="hidden print:inline">____</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
