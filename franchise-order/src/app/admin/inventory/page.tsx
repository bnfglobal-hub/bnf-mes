import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { STORAGE_LABEL, STORAGE_COLOR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { SyncStocksButton } from "@/components/admin/sync-stocks-button";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  await requireRole(STAFF_ROLES);
  const admin = createAdminClient();

  const [{ data: snapshots }, { data: reservations }, { data: warehouses }] = await Promise.all([
    admin.from("inventory_snapshots").select("*, products(name, spec, storage_type, ecount_item_code), warehouses(name, code)").order("synced_at", { ascending: false }),
    admin.from("inventory_reservations").select("product_id, qty").eq("released", false),
    admin.from("warehouses").select("id, name").eq("is_active", true),
  ]);

  const resvMap = new Map<string, number>();
  for (const r of reservations ?? []) resvMap.set(r.product_id, (resvMap.get(r.product_id) ?? 0) + Number(r.qty));

  // 품목별 합산
  const byProduct = new Map<string, { name: string; spec: string; storage: string; code: string; total: number; safety: number; wh: { name: string; qty: number }[] }>();
  let lastSynced: string | null = null;
  for (const s of snapshots ?? []) {
    const p = s.products as { name?: string; spec?: string; storage_type?: string; ecount_item_code?: string } | null;
    if (!p) continue;
    if (!lastSynced || s.synced_at > lastSynced) lastSynced = s.synced_at;
    const cur = byProduct.get(s.product_id) ?? { name: p.name ?? "", spec: p.spec ?? "", storage: p.storage_type ?? "ROOM", code: p.ecount_item_code ?? "", total: 0, safety: 0, wh: [] };
    cur.total += Number(s.qty);
    cur.safety += Number(s.safety_qty);
    cur.wh.push({ name: (s.warehouses as { name?: string } | null)?.name ?? "-", qty: Number(s.qty) });
    byProduct.set(s.product_id, cur);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">재고현황</h1>
          <p className="mt-1 text-sm text-muted">
            최종 재고 반영: <b>{lastSynced ? formatDateTime(lastSynced) : "동기화 이력 없음"}</b> · 창고 {(warehouses ?? []).length}곳
          </p>
        </div>
        <SyncStocksButton />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead><tr className="border-b border-border bg-gray-50/60 text-left text-xs text-muted">
            <th className="px-3 py-2.5">품목코드</th><th className="px-3 py-2.5">품명</th><th className="px-3 py-2.5">보관</th>
            <th className="px-3 py-2.5 text-right">현재고</th><th className="px-3 py-2.5 text-right">예약수량</th>
            <th className="px-3 py-2.5 text-right">안전재고</th><th className="px-3 py-2.5 text-right">판매가능</th>
            <th className="px-3 py-2.5">창고별</th>
          </tr></thead>
          <tbody>
            {byProduct.size === 0 && (
              <tr><td colSpan={8} className="py-14 text-center text-gray-400">재고 데이터가 없습니다. 우측 상단 &lsquo;재고 동기화&rsquo;를 실행하세요.</td></tr>
            )}
            {[...byProduct.entries()].map(([pid, v]) => {
              const reserved = resvMap.get(pid) ?? 0;
              const available = v.total - reserved - v.safety;
              return (
                <tr key={pid} className="border-b border-gray-50">
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{v.code || "-"}</td>
                  <td className="px-3 py-2.5 font-medium">{v.name} <span className="text-xs text-muted">{v.spec}</span></td>
                  <td className="px-3 py-2.5"><Badge className={STORAGE_COLOR[v.storage]}>{STORAGE_LABEL[v.storage]}</Badge></td>
                  <td className="px-3 py-2.5 text-right">{formatNumber(v.total)}</td>
                  <td className="px-3 py-2.5 text-right text-amber-600">{formatNumber(reserved)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-500">{formatNumber(v.safety)}</td>
                  <td className={`px-3 py-2.5 text-right font-bold ${available <= 0 ? "text-danger" : available < 10 ? "text-amber-600" : "text-emerald-600"}`}>{formatNumber(available)}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">{v.wh.map((w) => `${w.name} ${formatNumber(w.qty)}`).join(" · ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
