"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ClipboardList, Truck, PackageCheck, Building2, Store, Package,
  Boxes, Warehouse, Megaphone, MessageSquareWarning, Plug, Users, Settings, ScrollText, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  dashboard: LayoutDashboard, orders: ClipboardList, shipping: Truck, picking: PackageCheck,
  customers: Building2, stores: Store, products: Package, inventory: Boxes, warehouses: Warehouse,
  announcements: Megaphone, claims: MessageSquareWarning, ecount: Plug, users: Users,
  settings: Settings, audit: ScrollText,
};

export function AdminSidebar({ items, userName, roleLabel }: { items: NavItem[]; userName: string; roleLabel: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
      {items.map((item) => {
        const Icon = ICONS[item.icon] ?? LayoutDashboard;
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium",
              active ? "bg-primary-light text-primary" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 모바일 헤더 */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-white px-4 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="메뉴"><Menu size={22} /></button>
        <span className="text-[15px] font-bold">BNF 물류 관리자</span>
      </header>

      {/* 모바일 드로어 */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <span className="font-bold">BNF 물류 관리자</span>
              <button onClick={() => setOpen(false)} aria-label="닫기"><X size={20} /></button>
            </div>
            {nav}
            <div className="border-t border-border px-4 py-3 text-xs text-muted">{userName} · {roleLabel}</div>
          </div>
        </div>
      )}

      {/* 데스크톱 사이드바 */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-black text-white">B</div>
          <div>
            <p className="text-sm font-bold leading-tight">BNF 프랜차이즈 물류</p>
            <p className="text-[11px] text-muted">관리자</p>
          </div>
        </div>
        {nav}
        <div className="border-t border-border px-5 py-3">
          <p className="text-sm font-semibold">{userName}</p>
          <p className="text-xs text-muted">{roleLabel}</p>
          <form action="/api/logout" method="post">
            <button type="submit" className="mt-2 text-xs text-gray-400 underline">로그아웃</button>
          </form>
        </div>
      </aside>
    </>
  );
}
