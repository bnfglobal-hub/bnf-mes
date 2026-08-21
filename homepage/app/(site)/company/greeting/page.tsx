import type { Metadata } from "next";
import PageHeader from "@/app/components/PageHeader";
import { content, paragraphs } from "@/lib/content";

export const metadata: Metadata = {
  title: "인사말",
  description: "㈜비엔에프글로벌은 새로운 식품문화를 선도합니다 — 대표이사 인사말.",
};

export default function GreetingPage() {
  const g = content.greeting;

  return (
    <>
      <PageHeader title="인사말" section="회사소개" current="/company/greeting" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <h2 className="text-[clamp(1.15rem,2.4vw,1.6rem)] font-bold leading-snug">
          {g.headline}
        </h2>

        <div className="mt-10 grid gap-12 md:grid-cols-[1.25fr_1fr] md:items-start">
          <div className="space-y-6 text-[15px] leading-[1.9]">
            {paragraphs(g.body).map((p) => (
              <p key={p}>{p}</p>
            ))}
            <p className="pt-4 text-[15px] font-bold text-muted">{g.signature}</p>
          </div>

          {g.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={g.image}
              alt="신선한 식재료"
              className="content-img"
              loading="lazy"
              width={1215}
              height={805}
            />
          )}
        </div>
      </section>
    </>
  );
}
