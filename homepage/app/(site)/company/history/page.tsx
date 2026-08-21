import type { Metadata } from "next";
import PageHeader from "@/app/components/PageHeader";
import { content } from "@/lib/content";

export const metadata: Metadata = {
  title: "회사연혁",
  description: "1990년 설립부터 오늘까지 — ㈜비엔에프글로벌 연혁.",
};

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="회사연혁" section="회사소개" current="/company/history" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <ol className="max-w-3xl">
          {content.history.map((h, hi) => (
            <li key={h.year} className="flex gap-6 border-b border-line py-6 last:border-b-0 sm:gap-10">
              <span className="w-[62px] shrink-0 text-[20px] font-extrabold leading-tight text-brand tabular-nums sm:text-[22px]">
                <span data-edit={`history.${hi}.year`}>{h.year}</span>
              </span>
              <div className="space-y-1 pt-0.5 text-[14.5px] leading-relaxed">
                {h.events.map((line, ei) => (
                  <p key={line} data-edit={`history.${hi}.events.${ei}`}>{line}</p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
