import Link from "next/link";
import { NAV } from "./nav";

/** 서브페이지 공통 헤더 — 제목 + 같은 대분류 안의 형제 메뉴 탭 */
export default function PageHeader({
  title,
  section,
  current,
  lead,
}: {
  title: string;
  /** 대분류 라벨 (회사소개 / 제품소개 / 고객센터) */
  section: string;
  /** 현재 페이지 href */
  current: string;
  lead?: string;
}) {
  const group = NAV.find((n) => n.label === section);

  return (
    <div className="border-b border-line">
      <div className="mx-auto max-w-[1180px] px-5 pb-0 pt-12">
        <nav aria-label="현재 위치" className="text-[12px] text-faint">
          <Link href="/" className="hover:text-ink">HOME</Link>
          <span className="mx-2">›</span>
          <span>{section}</span>
          <span className="mx-2">›</span>
          <span className="text-muted">{title}</span>
        </nav>

        <h1 className="page-title mt-4">{title}</h1>
        {lead && <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">{lead}</p>}

        {group?.children && (
          <nav aria-label={`${section} 하위 메뉴`} className="mt-8 flex flex-wrap gap-x-1 gap-y-1 overflow-x-auto">
            {group.children.map((c) => {
              const active = c.href === current;
              return (
                <Link
                  key={c.href}
                  href={c.href}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap border-b-2 px-4 py-3 text-[13.5px] font-bold transition-colors ${
                    active
                      ? "border-brand text-brand"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {c.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
