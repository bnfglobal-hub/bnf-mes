import Link from "next/link";
import { Bell, ChevronRight, Megaphone, RotateCcw, Clock, Truck, CreditCard } from "lucide-react";
import { requireFranchise } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreCatalog, getCartLines } from "@/lib/franchise-data";
import { loadDeliveryRule, loadHolidays, nowKst } from "@/lib/domain/order-service";
import { canOrderToday, isBeforeCutoff, calcShipDate, formatShipDateLabel } from "@/lib/domain/delivery-date";
import { formatNumber, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ReorderButton } from "@/components/franchise/reorder-button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await requireFranchise();
  const admin = createAdminClient();

  const [{ data: store }, rule, holidays, cartLines, catalog] = await Promise.all([
    admin.from("stores").select("*").eq("id", profile.store_id).single(),
    loadDeliveryRule(),
    loadHolidays(),
    getCartLines(profile.store_id, profile.id),
    getStoreCatalog(profile.store_id),
  ]);

  const [{ data: announcements }, { data: recentOrders }, { count: unreadCount }] = await Promise.all([
    admin.from("announcements").select("id, title, is_important, is_pinned, created_at")
      .lte("starts_at", new Date().toISOString())
      .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
      .order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(3),
    admin.from("orders").select("id, order_no, status, total_amount, ordered_at")
      .eq("store_id", profile.store_id).neq("status", "DRAFT")
      .order("ordered_at", { ascending: false }).limit(3),
    admin.from("notifications").select("id", { count: "exact", head: true })
      .eq("profile_id", profile.id).eq("is_read", false),
  ]);

  const now = nowKst();
  const cutoff = store?.order_cutoff?.slice(0, 5) ?? rule.weekdayCutoff;
  const orderable = canOrderToday(now, rule, holidays);
  const beforeCutoff = isBeforeCutoff(now, cutoff);
  const canOrderNow = orderable.ok && beforeCutoff && !store?.order_blocked;
  const shipDate = calcShipDate(now, rule, {
    deliveryDays: store?.delivery_days ?? [1, 2, 3, 4, 5],
    orderCutoff: cutoff,
  }, holidays);

  const cartTotal = cartLines.reduce((sum, l) => {
    const item = catalog.find((c) => c.productId === l.productId);
    return sum + (item ? item.unitPrice * l.qty : 0);
  }, 0);

  return (
    <main className="px-4 pt-4">
      {/* 헤더 */}
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">안녕하세요</p>
          <h1 className="text-lg font-bold">{store?.name}</h1>
        </div>
        <Link href="/app/my/notifications" className="relative rounded-full p-2 hover:bg-gray-50" aria-label="알림">
          <Bell size={22} />
          {(unreadCount ?? 0) > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Link>
      </header>

      {/* 주문 가능 상태 카드 */}
      <section className={`rounded-2xl p-4 ${canOrderNow ? "bg-primary-light" : "bg-gray-50"}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${canOrderNow ? "bg-success" : "bg-gray-400"}`} />
          <p className="text-[15px] font-bold">
            {store?.order_blocked ? "주문이 차단되었습니다 (본사 문의)" : canOrderNow ? "지금 주문 가능" : orderable.ok ? "오늘 주문 마감" : orderable.reason}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-gray-700">
            <Clock size={15} className="text-primary" />
            마감 {cutoff}
          </div>
          <div className="flex items-center gap-1.5 text-gray-700">
            <Truck size={15} className="text-primary" />
            {canOrderNow ? "지금 주문 시 " : "다음 출고 "}{formatShipDateLabel(shipDate)}
          </div>
          <div className="col-span-2 flex items-center gap-1.5 text-gray-700">
            <CreditCard size={15} className="text-primary" />
            최소 주문금액 {formatNumber(Number(store?.min_order_amount ?? 0))}원
            {store?.min_amount_basis === "WITH_VAT" ? " (VAT 포함)" : " (공급가 기준)"}
          </div>
        </div>
      </section>

      {/* 장바구니 현황 */}
      {cartLines.length > 0 && (
        <Link href="/app/cart" className="mt-3 flex items-center justify-between rounded-2xl border border-orange-200 bg-white p-4 active:bg-orange-50">
          <span className="text-sm font-medium">장바구니 {cartLines.length}개 상품</span>
          <span className="flex items-center text-[15px] font-bold text-primary">
            {formatNumber(cartTotal)}원 <ChevronRight size={18} />
          </span>
        </Link>
      )}

      {/* 공지 */}
      {(announcements ?? []).length > 0 && (
        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-[15px] font-bold"><Megaphone size={16} className="text-primary" /> 공지사항</h2>
            <Link href="/app/my/notices" className="text-xs text-muted">전체보기</Link>
          </div>
          <ul className="space-y-1.5">
            {(announcements ?? []).map((a) => (
              <li key={a.id}>
                <Link href={`/app/my/notices/${a.id}`} className="flex items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-3 active:bg-gray-50">
                  {a.is_important && <Badge className="bg-red-50 text-danger">중요</Badge>}
                  <span className="min-w-0 flex-1 truncate text-sm">{a.title}</span>
                  <span className="text-xs text-gray-400">{formatDate(a.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 최근 주문 */}
      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-bold">최근 주문</h2>
          <Link href="/app/orders" className="text-xs text-muted">전체보기</Link>
        </div>
        {(recentOrders ?? []).length === 0 ? (
          <p className="rounded-xl bg-gray-50 py-8 text-center text-sm text-gray-400">아직 주문이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {(recentOrders ?? []).map((o) => (
              <li key={o.id} className="rounded-2xl border border-border bg-white p-3.5">
                <Link href={`/app/orders/${o.id}`} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{o.order_no}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatDate(o.ordered_at)} · {formatNumber(Number(o.total_amount))}원</p>
                  </div>
                  <Badge className={ORDER_STATUS_COLOR[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                </Link>
                <div className="mt-2.5 border-t border-gray-50 pt-2.5">
                  <ReorderButton orderId={o.id}>
                    <RotateCcw size={14} /> 이 주문 다시 담기
                  </ReorderButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 바로가기 */}
      <section className="mb-4 mt-5 grid grid-cols-2 gap-2">
        <Link href="/app/products?filter=FREQUENT" className="rounded-2xl bg-primary-light p-4 active:bg-orange-100">
          <p className="text-sm font-bold text-primary">자주 주문한 상품</p>
          <p className="mt-0.5 text-xs text-muted">빠르게 다시 담기</p>
        </Link>
        <Link href="/app/products" className="rounded-2xl bg-gray-50 p-4 active:bg-gray-100">
          <p className="text-sm font-bold">전체 상품 보기</p>
          <p className="mt-0.5 text-xs text-muted">{catalog.length}개 취급 상품</p>
        </Link>
      </section>
    </main>
  );
}
