"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/company", label: "회사소개" },
  { href: "/business", label: "사업분야" },
  { href: "/products", label: "제조품목" },
  { href: "/contact", label: "OEM·문의" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-[6px] bg-brand text-[15px] font-black text-white"
          >
            B
          </span>
          <span className="display display-slant text-[15px] text-ink">
            B&amp;F GLOBAL
          </span>
        </Link>

        <nav aria-label="주 메뉴" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3.5 py-2 text-[13.5px] font-semibold transition-colors ${
                  active ? "text-brand" : "text-ink/85 hover:text-brand"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
          <a
            href="https://smartstore.naver.com/bnfglobal"
            target="_blank"
            rel="noreferrer"
            className="ml-2 rounded-md border border-line-strong px-3.5 py-2 text-[13.5px] font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
          >
            쇼핑몰 ↗
          </a>
          <Link
            href="/contact"
            className="ml-1 rounded-full bg-ink px-4.5 py-2 text-[13.5px] font-bold text-bg transition-colors hover:bg-brand hover:text-white"
          >
            OEM 견적 문의
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          className="grid h-11 w-11 place-items-center rounded-md text-ink md:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? (
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

      {open && (
        <nav aria-label="모바일 메뉴" className="border-t border-line bg-bg px-5 py-3 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-3 text-[15px] font-semibold text-ink hover:text-brand"
            >
              {n.label}
            </Link>
          ))}
          <a
            href="https://smartstore.naver.com/bnfglobal"
            target="_blank"
            rel="noreferrer"
            className="block rounded-md px-3 py-3 text-[15px] font-semibold text-muted"
          >
            네이버 쇼핑몰 ↗
          </a>
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-md bg-brand px-4 py-3 text-center text-[15px] font-bold text-white"
          >
            OEM 견적 문의
          </Link>
        </nav>
      )}
    </header>
  );
}
