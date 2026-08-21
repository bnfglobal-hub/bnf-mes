import type { Metadata } from "next";
import PageHeader from "@/app/components/PageHeader";
import { content } from "@/lib/content";

export const metadata: Metadata = {
  title: "인증현황",
  description: "품목군별 HACCP 인증, 기업부설연구소, 벤처기업·이노비즈 확인, 특허.",
};

export default function CertificationPage() {
  const c = content.certification;

  return (
    <>
      <PageHeader
        title="인증 현황"
        section="회사소개"
        current="/company/certification"
        lead={c.lead}
      />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {c.list.map((item) => (
            <li key={item.title} className="flex items-start gap-3 border border-line px-5 py-4">
              <span className="mt-0.5 shrink-0 bg-brand-soft px-2 py-1 text-[11px] font-bold text-brand">
                {item.group}
              </span>
              <span className="text-[13.5px] font-bold leading-snug">{item.title}</span>
            </li>
          ))}
        </ul>

        {c.image && (
          <div className="mt-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.image}
              alt="인증서 원본 이미지"
              className="content-img border border-line"
              loading="lazy"
              width={727}
              height={891}
            />
          </div>
        )}
      </section>
    </>
  );
}
