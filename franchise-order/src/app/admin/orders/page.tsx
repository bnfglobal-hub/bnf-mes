import Link from "next/link";
import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, ERP_STATUS_LABEL, ERP_STATUS_COLOR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BulkConfirmBar } from "@/components/admin/bulk-confirm";

export const dynamic = "force-dynamic";

interface Search {
  status?: string; erp?: string; q?: string; from?: string; to?: string; store?: string; page?: string;
}

const PAGE_SIZE = 30;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireRole(STAFF_ROLES);
  const sp = await searchParams;
  const admin = createAdminClient();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  let query = admin.from("orders")
    .select("id, order_no, status, erp_status, total_amount, ordered_at, planned_ship_date, ecount_doc_no, stores(name, brands(name))", { count: "exact" })
    .neq("status", "DRAFT")
    .order("ordered_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (sp.status) query = query.eq("status", sp.status);
  if (sp.erp) query = query.eq("erp_status", sp.erp);
  if (sp.q) query = query.ilike("order_no", `%${sp.q}%`);
  if (sp.from) query = query.gte("ordered_at", sp.from);
  if (sp.to) query = query.lte("ordered_at", sp.to + "T23:59:59");
  const { data: orders, count } = await query;

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const qs = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) params.set(k, v);
    return `/admin/orders?${params.toString()}`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">주문관리</h1>
        <a href={`/admin/orders/export?${new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString()}`}>
          <Button variant="outline" size="sm">엑셀(CSV) 다운로드</Button>
        </a>
      </div>

      {/* 필터 */}
      <form className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-white p-3 md:grid-cols-6" method="get">
        <input type="date" name="from" defaultValue={sp.from} className="h-10 rounded-lg border border-border px-2 text-sm" />
        <input type="date" name="to" defaultValue={sp.to} className="h-10 rounded-lg border border-border px-2 text-sm" />
        <select name="status" defaultValue={sp.status ?? ""} className="h-10 rounded-lg border border-border px-2 text-sm">
          <option value="">전체 상태</option>
          {Object.entries(ORDER_STATUS_LABEL).filter(([k]) => k !== "DRAFT").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="erp" defaultValue={sp.erp ?? ""} className="h-10 rounded-lg border border-border px-2 text-sm">
          <option value="">전체 ERP 상태</option>
          {Object.entries(ERP_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input name="q" defaultValue={sp.q} placeholder="주문번호 검색" className="h-10 rounded-lg border border-border px-2 text-sm" />
        <button type="submit" className="h-10 rounded-lg bg-primary text-sm font-semibold text-white">검색</button>
      </form>

      <BulkConfirmBar>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/60 text-left text-xs text-muted">
                <th className="w-10 px-3 py-2.5"></th>
                <th className="px-3 py-2.5">주문번호</th>
                <th className="px-3 py-2.5">가맹점</th>
                <th className="px-3 py-2.5">주문일시</th>
                <th className="px-3 py-2.5">출고예정</th>
                <th className="px-3 py-2.5 text-right">금액</th>
                <th className="px-3 py-2.5">상태</th>
                <th className="px-3 py-2.5">ERP</th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).length === 0 && (
                <tr><td colSpan={8} className="py-14 text-center text-gray-400">조건에 맞는 주문이 없습니다.</td></tr>
              )}
              {(orders ?? []).map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-orange-50/30">
                  <td className="px-3 py-2.5">
                    {o.status === "PENDING" && <input type="checkbox" data-bulk-id={o.id} className="h-4 w-4 accent-orange-500" />}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-primary hover:underline">{o.order_no}</Link>
                    {o.ecount_doc_no && <p className="text-[11px] text-muted">전표 {o.ecount_doc_no}</p>}
                  </td>
                  <td className="px-3 py-2.5">
                    {(o.stores as { name?: string } | null)?.name}
                    <p className="text-[11px] text-muted">{(o.stores as { brands?: { name?: string } | null } | null)?.brands?.name}</p>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{formatDateTime(o.ordered_at)}</td>
                  <td className="px-3 py-2.5">{o.planned_ship_date ?? "-"}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{formatNumber(Number(o.total_amount))}원</td>
                  <td className="px-3 py-2.5"><Badge className={ORDER_STATUS_COLOR[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge></td>
                  <td className="px-3 py-2.5"><Badge className={ERP_STATUS_COLOR[o.erp_status]}>{ERP_STATUS_LABEL[o.erp_status]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BulkConfirmBar>

      {/* 페이지네이션 */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <p className="text-muted">총 {count ?? 0}건</p>
        <div className="flex gap-1">
          {page > 1 && <Link href={qs({ page: String(page - 1) })} className="rounded-lg border border-border bg-white px-3 py-1.5">이전</Link>}
          <span className="px-3 py-1.5 text-muted">{page} / {totalPages}</span>
          {page < totalPages && <Link href={qs({ page: String(page + 1) })} className="rounded-lg border border-border bg-white px-3 py-1.5">다음</Link>}
        </div>
      </div>
    </div>
  );
}
