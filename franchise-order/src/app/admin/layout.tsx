import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/constants";
import { AdminSidebar, type NavItem } from "@/components/admin/sidebar";

const ALL_NAV: (NavItem & { roles?: string[] })[] = [
  { href: "/admin", label: "대시보드", icon: "dashboard", roles: ["super_admin", "hq_admin"] },
  { href: "/admin/orders", label: "주문관리", icon: "orders" },
  { href: "/admin/picking", label: "피킹관리", icon: "picking" },
  { href: "/admin/shipping", label: "출고·배송", icon: "shipping" },
  { href: "/admin/stores", label: "가맹점관리", icon: "stores", roles: ["super_admin", "hq_admin"] },
  { href: "/admin/products", label: "상품관리", icon: "products", roles: ["super_admin", "hq_admin"] },
  { href: "/admin/inventory", label: "재고현황", icon: "inventory" },
  { href: "/admin/announcements", label: "공지사항", icon: "announcements", roles: ["super_admin", "hq_admin"] },
  { href: "/admin/claims", label: "클레임관리", icon: "claims", roles: ["super_admin", "hq_admin"] },
  { href: "/admin/ecount", label: "이카운트 연동", icon: "ecount", roles: ["super_admin", "hq_admin"] },
  { href: "/admin/users", label: "사용자·권한", icon: "users", roles: ["super_admin", "hq_admin"] },
  { href: "/admin/settings", label: "시스템 설정", icon: "settings", roles: ["super_admin", "hq_admin"] },
  { href: "/admin/audit", label: "감사로그", icon: "audit", roles: ["super_admin"] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(STAFF_ROLES);
  const items = ALL_NAV.filter((n) => !n.roles || n.roles.includes(profile.role)).map(({ href, label, icon }) => ({ href, label, icon }));

  return (
    <div className="min-h-dvh bg-gray-50/60">
      <AdminSidebar items={items} userName={profile.full_name} roleLabel={ROLE_LABEL[profile.role]} />
      <main className="px-4 py-5 lg:ml-60 lg:px-8 lg:py-7">{children}</main>
    </div>
  );
}
