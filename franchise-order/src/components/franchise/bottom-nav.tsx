"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingCart, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/app", label: "홈", icon: Home, exact: true },
  { href: "/app/products", label: "상품", icon: Package },
  { href: "/app/cart", label: "장바구니", icon: ShoppingCart },
  { href: "/app/orders", label: "주문내역", icon: ClipboardList },
  { href: "/app/my", label: "마이", icon: User },
];

export function BottomNav({ cartCount }: { cartCount: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-safe">
      <div className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                active ? "text-primary" : "text-gray-400"
              )}
            >
              <span className="relative">
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                {tab.label === "장바구니" && cartCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
