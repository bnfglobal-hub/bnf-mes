import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireFranchise } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, STORAGE_LABEL, STORAGE_COLOR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ReorderButton } from "@/components/franchise/reorder-button";
import { CancelRequestButton } from "@/components/franchise/cancel-request-button";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireFranchise();
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("*, order_items(*), order_status_histories(from_status, to_status, changed_at, reason), shipments(driver_name, tracking_no, departed_at, delivered_at)")
    .eq("id", id)
    .eq("store_id", profile.store_id)
    .single();
  if (!order) notFound();

  const shipTo = order.ship_to as { address1?: string; address2?: string; receiver?: string; phone?: string } | null;

  return (
    <main className="px-4 pt-4 pb-8">
      <div className="flex items-center gap-2">
        <Link href="/app/orders" className="rounded-full p-1.5 hover:bg-gray-50" aria-label="뒤로"><ChevronLeft size={22} /></Link>
        <h1 className="text-lg font-bold">{order.order_no}</h1>
        <Badge className={ORDER_STATUS_COLOR[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
      </div>

      <section className="mt-4 rounded-2xl border border-border bg-white p-4 text-sm">
        <div className="flex justify-between py-0.5"><span className="text-muted">주문일시</span><span>{formatDateTime(order.ordered_at)}</span></div>
        <div className="flex justify-between py-0.5"><span className="text-muted">출고 예정일</span><span>{order.planned_ship_date ?? "-"}</span></div>
        {shipTo?.address1 && (
          <div className="flex justify-between gap-4 py-0.5"><span className="shrink-0 text-muted">배송지</span><span className="text-right">{shipTo.address1} {shipTo.address2 ?? ""}</span></div>
        )}
        {order.memo && <div className="flex justify-between gap-4 py-0.5"><span className="shrink-0 text-muted">메모</span><span className="text-right">{order.memo}</span></div>}
      </section>

      <section className="mt-3">
        <h2 className="mb-2 text-[15px] font-bold">주문 상품 ({order.order_items.length})</h2>
        <ul className="space-y-2">
          {order.order_items.map((it: Record<string, unknown>) => {
            const snap = it.product_snapshot as { name: string; spec?: string; storage_type?: string };
            return (
              <li key={it.id as string} className="rounded-xl border border-border bg-white px-3.5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {snap.storage_type && <Badge className={STORAGE_COLOR[snap.storage_type]}>{STORAGE_LABEL[snap.storage_type]}</Badge>}
                      <p className="truncate text-sm font-semibold">{snap.name}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {snap.spec} · {formatNumber(Number(it.unit_price))}원 × {String(it.qty)}
                      {Number(it.shipped_qty) > 0 && Number(it.shipped_qty) !== Number(it.qty) ? ` (출고 ${it.shipped_qty})` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold">{formatNumber(Number(it.supply_amount) + Number(it.vat_amount))}원</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-3 rounded-2xl bg-gray-50 p-4 text-sm">
        <div className="flex justify-between py-0.5"><span className="text-muted">공급가</span><span>{formatNumber(Number(order.supply_amount))}원</span></div>
        <div className="flex justify-between py-0.5"><span className="text-muted">부가세</span><span>{formatNumber(Number(order.vat_amount))}원</span></div>
        <div className="flex justify-between py-0.5"><span className="text-muted">배송비</span><span>{Number(order.delivery_fee) === 0 ? "무료" : formatNumber(Number(order.delivery_fee)) + "원"}</span></div>
        <div className="mt-1 flex justify-between border-t border-gray-200 pt-2 text-base font-bold"><span>총 금액</span><span className="text-primary">{formatNumber(Number(order.total_amount))}원</span></div>
      </section>

      {(order.shipments ?? []).length > 0 && (
        <section className="mt-3 rounded-2xl border border-border bg-white p-4 text-sm">
          <h2 className="mb-1 font-bold">배송 정보</h2>
          {order.shipments.map((s: Record<string, unknown>, i: number) => (
            <div key={i} className="py-0.5 text-gray-700">
              {s.driver_name ? `기사: ${s.driver_name}` : ""} {s.tracking_no ? `· 운송장 ${s.tracking_no}` : ""}
              {s.delivered_at ? ` · 배송완료 ${formatDateTime(s.delivered_at as string)}` : s.departed_at ? ` · 출발 ${formatDateTime(s.departed_at as string)}` : ""}
            </div>
          ))}
        </section>
      )}

      <section className="mt-3 rounded-2xl border border-border bg-white p-4">
        <h2 className="mb-2 text-sm font-bold">진행 이력</h2>
        <ul className="space-y-1.5 text-xs text-gray-600">
          {(order.order_status_histories ?? [])
            .sort((a: { changed_at: string }, b: { changed_at: string }) => a.changed_at.localeCompare(b.changed_at))
            .map((h: { to_status: string; changed_at: string; reason: string | null }, i: number) => (
              <li key={i} className="flex justify-between">
                <span>{ORDER_STATUS_LABEL[h.to_status]}{h.reason ? ` — ${h.reason}` : ""}</span>
                <span className="text-gray-400">{formatDateTime(h.changed_at)}</span>
              </li>
            ))}
        </ul>
      </section>

      <div className="mt-4 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl border border-border bg-white px-4 py-3">
            <ReorderButton orderId={order.id}>이 주문 다시 담기</ReorderButton>
          </div>
          <Link href={`/app/orders/${order.id}/claim`} className="flex-1 rounded-xl border border-border bg-white px-4 py-3 text-center text-[13px] font-semibold text-gray-700">
            클레임 등록
          </Link>
        </div>
        {["PENDING", "CONFIRMED"].includes(order.status) && <CancelRequestButton orderId={order.id} />}
      </div>
    </main>
  );
}
