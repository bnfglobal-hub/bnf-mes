import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, ERP_STATUS_LABEL, ERP_STATUS_COLOR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderActions, OrderItemEditor } from "@/components/admin/order-actions";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireRole(STAFF_ROLES);
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("*, order_items(*), stores(name, store_code, phone, ecount_customer_code), order_status_histories(*, profiles(full_name)), ecount_sync_jobs(*)")
    .eq("id", id)
    .single();
  if (!order) notFound();

  const shipTo = order.ship_to as { address1?: string; address2?: string; receiver?: string; phone?: string; delivery_note?: string } | null;
  const isAdmin = ["super_admin", "hq_admin"].includes(profile.role);

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/orders" className="rounded-full p-1.5 hover:bg-gray-100" aria-label="뒤로"><ChevronLeft size={20} /></Link>
        <h1 className="text-xl font-bold">{order.order_no}</h1>
        <Badge className={ORDER_STATUS_COLOR[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
        <Badge className={ERP_STATUS_COLOR[order.erp_status]}>ERP: {ERP_STATUS_LABEL[order.erp_status]}</Badge>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>주문 정보</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              <div className="flex justify-between"><span className="text-muted">가맹점</span><span className="font-semibold">{order.stores?.name} ({order.stores?.store_code})</span></div>
              <div className="flex justify-between"><span className="text-muted">거래처코드</span><span>{order.ecount_customer_code ?? order.stores?.ecount_customer_code ?? "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted">주문일시</span><span>{formatDateTime(order.ordered_at)}</span></div>
              <div className="flex justify-between"><span className="text-muted">출고 예정일</span><span>{order.planned_ship_date ?? "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted">희망 배송일</span><span>{order.requested_delivery_date ?? "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted">전표번호</span><span>{order.ecount_doc_no ?? "-"}</span></div>
            </div>
            {shipTo?.address1 && (
              <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                배송지: {shipTo.address1} {shipTo.address2 ?? ""} {shipTo.receiver ? `· ${shipTo.receiver}` : ""} {shipTo.phone ?? ""}
                {shipTo.delivery_note ? <span className="text-muted"> · {shipTo.delivery_note}</span> : null}
              </p>
            )}
            {order.memo && <p className="mt-2 rounded-lg bg-orange-50 px-3 py-2">메모: {order.memo}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>처리</CardTitle></CardHeader>
          <CardContent>
            <OrderActions orderId={order.id} status={order.status} erpStatus={order.erp_status} isAdmin={isAdmin} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>주문 품목 ({order.order_items.length})</CardTitle></CardHeader>
        <CardContent>
          <OrderItemEditor
            orderId={order.id}
            editable={isAdmin && ["PENDING", "CONFIRMED"].includes(order.status)}
            items={(order.order_items as Array<Record<string, unknown>>).map((it) => ({
              id: it.id as string,
              name: (it.product_snapshot as { name: string }).name,
              spec: (it.product_snapshot as { spec?: string }).spec ?? "",
              storage: (it.product_snapshot as { storage_type?: string }).storage_type ?? "ROOM",
              itemCode: (it.product_snapshot as { ecount_item_code?: string }).ecount_item_code ?? "",
              qty: Number(it.qty),
              shippedQty: Number(it.shipped_qty),
              unitPrice: Number(it.unit_price),
              supply: Number(it.supply_amount),
              vat: Number(it.vat_amount),
            }))}
          />
          <div className="mt-3 flex justify-end gap-6 border-t border-gray-100 pt-3 text-sm">
            <span>공급가 <b>{formatNumber(Number(order.supply_amount))}원</b></span>
            <span>부가세 <b>{formatNumber(Number(order.vat_amount))}원</b></span>
            <span>배송비 <b>{formatNumber(Number(order.delivery_fee))}원</b></span>
            <span className="text-primary">총액 <b>{formatNumber(Number(order.total_amount))}원</b></span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>상태 변경 이력</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {(order.order_status_histories as Array<Record<string, unknown>>)
                .sort((a, b) => String(a.changed_at).localeCompare(String(b.changed_at)))
                .map((h, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>
                      {h.from_status ? `${ORDER_STATUS_LABEL[h.from_status as string]} → ` : ""}{ORDER_STATUS_LABEL[h.to_status as string]}
                      {h.reason ? <span className="text-muted"> — {h.reason as string}</span> : null}
                    </span>
                    <span className="shrink-0 text-xs text-gray-400">
                      {(h.profiles as { full_name?: string } | null)?.full_name ?? ""} {formatDateTime(h.changed_at as string)}
                    </span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>ERP 전송 작업</CardTitle></CardHeader>
          <CardContent>
            {(order.ecount_sync_jobs as Array<Record<string, unknown>>).length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">전송 작업이 없습니다. (확정 시 자동 등록)</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(order.ecount_sync_jobs as Array<Record<string, unknown>>).map((j) => (
                  <li key={j.id as string} className="rounded-lg border border-border p-2.5">
                    <div className="flex items-center justify-between">
                      <Badge className={ERP_STATUS_COLOR[j.status as string]}>{ERP_STATUS_LABEL[j.status as string]}</Badge>
                      <span className="text-xs text-muted">시도 {String(j.attempts)}/{String(j.max_attempts)}</span>
                    </div>
                    {Boolean(j.ecount_doc_no) && <p className="mt-1">전표: {j.ecount_doc_no as string}</p>}
                    {Boolean(j.last_error_message) && <p className="mt-1 text-xs text-danger">{j.last_error_message as string}</p>}
                    {Boolean(j.next_retry_at) && (j.status === "RETRYING") && <p className="mt-0.5 text-xs text-muted">다음 재시도: {formatDateTime(j.next_retry_at as string)}</p>}
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
