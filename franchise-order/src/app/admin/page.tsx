import Link from "next/link";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNumber } from "@/lib/utils";
import { STORAGE_LABEL } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();

  // 서버 컴포넌트의 요청 시점 기준 날짜 (매 요청 재계산이 의도된 동작)
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now - 7 * 86400_000);

  const [
    { data: todayOrders },
    { count: pendingCount },
    { count: confirmedCount },
    { count: pickingCount },
    { count: shippedCount },
    { count: erpFailedCount },
    { data: weekOrders },
    { data: lowStock },
  ] = await Promise.all([
    admin.from("orders").select("total_amount, store_id, stores(name, brand_id, brands(name))").gte("ordered_at", todayStart.toISOString()).not("status", "in", "(CANCELLED,REJECTED,DRAFT)"),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "CONFIRMED"),
    admin.from("orders").select("id", { count: "exact", head: true }).in("status", ["PICKING", "PICKED"]),
    admin.from("orders").select("id", { count: "exact", head: true }).gte("shipped_at", todayStart.toISOString()),
    admin.from("orders").select("id", { count: "exact", head: true }).in("erp_status", ["FAILED", "RETRYING", "MANUAL_REVIEW"]),
    admin.from("orders").select("ordered_at, total_amount, order_items(product_snapshot, supply_amount)").gte("ordered_at", weekAgo.toISOString()).not("status", "in", "(CANCELLED,REJECTED,DRAFT)"),
    admin.from("inventory_snapshots").select("qty, safety_qty, products(name)").order("qty").limit(100),
  ]);

  const todayCount = (todayOrders ?? []).length;
  const todayAmount = (todayOrders ?? []).reduce((s, o) => s + Number(o.total_amount), 0);

  // 가맹점/브랜드별 오늘 주문금액
  const byStore = new Map<string, number>();
  const byBrand = new Map<string, number>();
  for (const o of todayOrders ?? []) {
    const storeName = (o.stores as { name?: string } | null)?.name ?? "-";
    const brandName = (o.stores as { brands?: { name?: string } | null } | null)?.brands?.name ?? "-";
    byStore.set(storeName, (byStore.get(storeName) ?? 0) + Number(o.total_amount));
    byBrand.set(brandName, (byBrand.get(brandName) ?? 0) + Number(o.total_amount));
  }

  // 7일 추이
  const trend = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400_000);
    trend.set(d.toISOString().slice(5, 10), 0);
  }
  for (const o of weekOrders ?? []) {
    const key = String(o.ordered_at).slice(5, 10);
    if (trend.has(key)) trend.set(key, (trend.get(key) ?? 0) + Number(o.total_amount));
  }
  const maxTrend = Math.max(1, ...trend.values());

  // 보관구분별 주문 현황 (7일)
  const byStorage = new Map<string, number>();
  for (const o of weekOrders ?? []) {
    for (const it of (o.order_items as { product_snapshot: { storage_type?: string }; supply_amount: number }[]) ?? []) {
      const st = it.product_snapshot?.storage_type ?? "ROOM";
      byStorage.set(st, (byStorage.get(st) ?? 0) + Number(it.supply_amount));
    }
  }

  const shortages = (lowStock ?? []).filter((s) => Number(s.qty) <= Number(s.safety_qty)).slice(0, 8);

  const STATS = [
    { label: "오늘 주문", value: `${todayCount}건`, sub: `${formatNumber(todayAmount)}원`, href: "/admin/orders" },
    { label: "발주 접수 (확정 대기)", value: `${pendingCount ?? 0}건`, href: "/admin/orders?status=PENDING", accent: (pendingCount ?? 0) > 0 },
    { label: "확정 (피킹 대기)", value: `${confirmedCount ?? 0}건`, href: "/admin/orders?status=CONFIRMED" },
    { label: "피킹 중", value: `${pickingCount ?? 0}건`, href: "/admin/picking" },
    { label: "오늘 출고", value: `${shippedCount ?? 0}건`, href: "/admin/shipping" },
    { label: "ERP 전송 실패", value: `${erpFailedCount ?? 0}건`, href: "/admin/ecount", danger: (erpFailedCount ?? 0) > 0 },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold">대시보드</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STATS.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className={`h-full p-4 transition-shadow hover:shadow-md ${s.danger ? "border-red-200 bg-red-50/50" : s.accent ? "border-orange-200" : ""}`}>
              <p className="text-xs text-muted">{s.label}</p>
              <p className={`mt-1 text-xl font-bold ${s.danger ? "text-danger" : ""}`}>{s.value}</p>
              {s.sub && <p className="text-xs text-muted">{s.sub}</p>}
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>최근 7일 주문 추이</CardTitle></CardHeader>
          <CardContent>
            <div className="flex h-36 items-end gap-2">
              {[...trend.entries()].map(([day, amt]) => (
                <div key={day} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-primary/80" style={{ height: `${Math.max(4, (amt / maxTrend) * 100)}%` }} title={`${formatNumber(amt)}원`} />
                  <span className="text-[10px] text-muted">{day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>가맹점별 오늘 주문금액</CardTitle></CardHeader>
          <CardContent>
            {byStore.size === 0 ? <p className="py-8 text-center text-sm text-gray-400">오늘 주문이 없습니다.</p> : (
              <ul className="space-y-1.5 text-sm">
                {[...byStore.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, amt]) => (
                  <li key={name} className="flex justify-between"><span>{name}</span><span className="font-semibold">{formatNumber(amt)}원</span></li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>보관구분별 주문 (7일, 공급가)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {(["FROZEN", "CHILLED", "ROOM"] as const).map((st) => (
                <div key={st} className="flex-1 rounded-xl bg-gray-50 p-3 text-center">
                  <Badge className={st === "FROZEN" ? "bg-blue-50 text-blue-700" : st === "CHILLED" ? "bg-sky-50 text-sky-600" : "bg-amber-50 text-amber-700"}>{STORAGE_LABEL[st]}</Badge>
                  <p className="mt-1.5 text-sm font-bold">{formatNumber(byStorage.get(st) ?? 0)}원</p>
                </div>
              ))}
            </div>
            {byBrand.size > 0 && (
              <ul className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm">
                {[...byBrand.entries()].map(([name, amt]) => (
                  <li key={name} className="flex justify-between text-gray-600"><span>브랜드: {name}</span><span>{formatNumber(amt)}원</span></li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>재고 부족 품목 (안전재고 이하)</CardTitle></CardHeader>
          <CardContent>
            {shortages.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">부족 품목이 없습니다.</p> : (
              <ul className="space-y-1.5 text-sm">
                {shortages.map((s, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{(s.products as { name?: string } | null)?.name}</span>
                    <span className="font-semibold text-danger">{formatNumber(Number(s.qty))} (안전 {formatNumber(Number(s.safety_qty))})</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
