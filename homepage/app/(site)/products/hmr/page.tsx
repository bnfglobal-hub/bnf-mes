import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import { content } from "@/lib/content";

export const metadata: Metadata = {
  title: "HMR(내수용)",
  description: "국내 브랜드에 공급하는 HMR·냉동 밀키트 제조 실적.",
};

export default function HmrPage() {
  const h = content.hmr;

  return (
    <>
      <PageHeader title="간편식 / HMR" section="제품소개" current="/products/hmr" lead={h.lead} />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <p className="text-[13.5px] font-bold text-muted">
          총 <span className="text-brand tabular-nums">{h.items.length}</span>개 제품 · OEM/ODM 제조 실적
        </p>

        <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
          {h.items.map((it, i) => (
            <li key={it.image + i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.image}
                alt={`${it.brand} ${it.name}`}
                className="aspect-square w-full bg-surface-2 object-cover"
                loading="lazy"
                width={500}
                height={500}
              />
              {it.brand && <p className="mt-3 text-[12px] font-bold text-brand">[{it.brand}]</p>}
              <p className="mt-0.5 text-[13.5px] font-bold leading-snug">{it.name}</p>
            </li>
          ))}
        </ul>

        <div className="mt-16 border-t border-line pt-10 text-center">
          <p className="text-[15px] font-bold">{h.ctaTitle}</p>
          <p className="mt-2 text-[13.5px] text-muted">{h.ctaDesc}</p>
          <Link
            href="/support/oem"
            className="mt-6 inline-block bg-brand px-7 py-3.5 text-[13.5px] font-bold text-white transition-colors hover:bg-brand-deep"
          >
            OEM 제조 견적 신청
          </Link>
        </div>
      </section>
    </>
  );
}
