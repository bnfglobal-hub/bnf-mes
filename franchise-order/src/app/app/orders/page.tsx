import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requireFranchise } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const profile = await requireFranchise();
  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("id, order_no, status, total_amount, ordered_at, planned_ship_date, order_items(id)")
    .eq("store_id", profile.store_id)
    .neq("status", "DRAFT")
    .order("ordered_at", { ascending: false })
    .limit(100);

  return (
    <main className="px-4 pt-4">
      <h1 className="text-lg font-bold">주문내역</h1>
      {(orders ?? []).length === 0 ? (
        <div className="flex flex-col items-center py-24 text-gray-400">
          <ClipboardList size={48} strokeWidth={1.2} />
          <p className="mt-3 text-sm">주문 내역이 없습니다.</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2 pb-4">
          {(orders ?? []).map((o) => (
            <li key={o.id}>
              <Link href={`/app/orders/${o.id}`} className="block rounded-2xl border border-border bg-white p-4 active:bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{o.order_no}</p>
                  <Badge className={ORDER_STATUS_COLOR[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {formatDateTime(o.ordered_at)} · {o.order_items.length}개 품목
                  {o.planned_ship_date ? ` · 출고예정 ${o.planned_ship_date}` : ""}
                </p>
                <p className="mt-1.5 text-[15px] font-bold">{formatNumber(Number(o.total_amount))}원</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
