import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import { content, company } from "@/lib/content";

export const metadata: Metadata = {
  title: "문의하기",
  description: "㈜비엔에프글로벌 문의 안내 — 대표번호, 팩스, 본사·제조공장 연락처.",
};

export default function ContactPage() {
  const c = content.contact;

  return (
    <>
      <PageHeader title="문의하기" section="고객센터" current="/support/contact" lead={c.lead} />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:max-w-3xl">
          <a href={`tel:${company.tel}`} className="group border border-line p-7 transition-colors hover:border-brand">
            <h2 className="text-[13px] font-bold tracking-wide text-faint group-hover:text-brand">대표번호</h2>
            <p className="mt-2 text-[26px] font-extrabold tabular-nums">{company.tel}</p>
            <p className="mt-1 text-[12.5px] text-muted">{content.oem.officeHours}</p>
          </a>

          <div className="border border-line p-7">
            <h2 className="text-[13px] font-bold tracking-wide text-faint">팩스</h2>
            <p className="mt-2 text-[26px] font-extrabold tabular-nums">{company.hq.fax}</p>
            <p className="mt-1 text-[12.5px] text-muted">문서 · 제안서 수신</p>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:max-w-3xl">
          {[company.hq, company.factory].map((loc) => (
            <article key={loc.addr} className="border border-line p-7">
              <h2 className="text-[15px] font-extrabold">{loc.name}</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed">{loc.addr}</p>
              <p className="mt-1.5 text-[12.5px] text-muted tabular-nums">
                T. {loc.tel} · F. {loc.fax}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 bg-surface-2 p-8 lg:max-w-3xl">
          <h2 className="text-[16px] font-extrabold">{c.ctaTitle}</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{c.ctaDesc}</p>
          <Link
            href="/support/oem"
            className="mt-5 inline-block bg-brand px-6 py-3.5 text-[13.5px] font-bold text-white transition-colors hover:bg-brand-deep"
          >
            OEM 견적 신청하기
          </Link>
        </div>

        {c.note && <p className="mt-10 text-[13px] leading-relaxed text-muted lg:max-w-3xl">{c.note}</p>}
      </section>
    </>
  );
}
