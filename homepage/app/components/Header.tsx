"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV } from "./nav";

export default function Header() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (item: (typeof NAV)[number]) => {
    if (item.href === "/") return pathname === "/";
    const root = "/" + item.href.split("/")[1];
    return pathname.startsWith(root);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center px-5">
        {/* 로고 */}
        <Link href="/" className="shrink-0" onClick={() => setMobileOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="B&F GLOBAL" className="h-[38px] w-auto" width={338} height={101} />
        </Link>

        {/* 데스크톱 메뉴 */}
        <nav
          aria-label="주 메뉴"
          className="ml-12 hidden flex-1 items-center gap-1 lg:flex"
          onMouseLeave={() => setOpenMenu(null)}
        >
          {NAV.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 text-[15px] font-bold text-ink transition-colors hover:text-brand"
              >
                {item.label}
              </a>
            ) : (
              <div key={item.label} className="relative" onMouseEnter={() => setOpenMenu(item.label)}>
                <Link
                  href={item.href}
                  aria-current={isActive(item) ? "page" : undefined}
                  aria-expanded={item.children ? openMenu === item.label : undefined}
                  className={`block px-6 py-3 text-[15px] font-bold transition-colors ${
                    isActive(item) ? "text-brand" : "text-ink hover:text-brand"
                  }`}
                >
                  {item.label}
                </Link>
                {item.children && openMenu === item.label && (
                  <div className="absolute left-0 top-full z-50 min-w-[200px] border border-line bg-white py-2 shadow-lg">
                    {item.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={() => setOpenMenu(null)}
                        className={`block px-5 py-2.5 text-[13.5px] transition-colors hover:bg-surface-2 hover:text-brand ${
                          pathname === c.href ? "font-bold text-brand" : "text-muted"
                        }`}
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </nav>

        {/* 우측 연락 정보 */}
        <div className="ml-auto hidden items-center gap-4 lg:flex">
          <a
            href="tel:1688-3362"
            className="text-[13px] font-bold text-muted transition-colors hover:text-brand"
          >
            대표번호 <span className="tabular-nums text-ink">1688-3362</span>
          </a>
          <Link
            href="/support/oem"
            className="bg-brand px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-brand-deep"
          >
            OEM 견적 신청
          </Link>
        </div>

        {/* 모바일 토글 */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
          className="ml-auto grid h-11 w-11 place-items-center lg:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {mobileOpen ? (
              <>
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <nav aria-label="모바일 메뉴" className="max-h-[75vh] overflow-y-auto border-t border-line bg-white px-5 py-3 lg:hidden">
          {NAV.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="block py-3 text-[15px] font-bold text-ink"
              >
                {item.label} ↗
              </a>
            ) : (
              <div key={item.label} className="border-b border-line py-1 last:border-b-0">
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 text-[15px] font-bold text-ink"
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="pb-2 pl-3">
                    {item.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={() => setMobileOpen(false)}
                        className="block py-2 text-[13.5px] text-muted"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
          <Link
            href="/support/oem"
            onClick={() => setMobileOpen(false)}
            className="mt-3 block bg-brand px-4 py-3 text-center text-[15px] font-bold text-white"
          >
            OEM 견적 신청
          </Link>
        </nav>
      )}
    </header>
  );
}
