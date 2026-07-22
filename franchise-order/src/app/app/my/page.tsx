import Link from "next/link";
import { ChevronRight, MapPin, Bell, Megaphone, MessageSquareWarning, Store } from "lucide-react";
import { requireFranchise } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logoutAction } from "@/app/login/actions";
import { ROLE_LABEL } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const profile = await requireFranchise();
  const admin = createAdminClient();
  const { data: store } = await admin.from("stores").select("name, store_code, min_order_amount, delivery_fee, phone, address1, address2").eq("id", profile.store_id).single();

  const MENU = [
    { href: "/app/my/notifications", label: "알림", icon: Bell },
    { href: "/app/my/notices", label: "공지사항", icon: Megaphone },
    { href: "/app/my/addresses", label: "배송지 관리", icon: MapPin },
    { href: "/app/my/claims", label: "클레임 내역", icon: MessageSquareWarning },
  ];

  return (
    <main className="px-4 pt-4">
      <h1 className="text-lg font-bold">마이</h1>

      <section className="mt-3 rounded-2xl bg-primary-light p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white"><Store size={22} /></div>
          <div>
            <p className="text-[15px] font-bold">{store?.name}</p>
            <p className="text-xs text-muted">고객코드 {store?.store_code} · {profile.full_name} ({ROLE_LABEL[profile.role]})</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-700">
          <div className="rounded-lg bg-white/70 px-3 py-2">최소주문 {formatNumber(Number(store?.min_order_amount ?? 0))}원</div>
          <div className="rounded-lg bg-white/70 px-3 py-2">배송비 {Number(store?.delivery_fee ?? 0) === 0 ? "무료" : formatNumber(Number(store?.delivery_fee)) + "원"}</div>
        </div>
      </section>

      <nav className="mt-4 divide-y divide-gray-50 rounded-2xl border border-border bg-white">
        {MENU.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.href} href={m.href} className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50">
              <Icon size={19} className="text-gray-400" />
              <span className="flex-1 text-[15px]">{m.label}</span>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 pb-6">
        <form action={logoutAction}>
          <button type="submit" className="w-full rounded-xl border border-border py-3 text-sm text-gray-500 active:bg-gray-50">
            로그아웃
          </button>
        </form>
        <p className="mt-4 text-center text-[11px] text-gray-300">비엔에프글로벌 발주 시스템 · ㈜비엔에프글로벌</p>
      </div>
    </main>
  );
}
