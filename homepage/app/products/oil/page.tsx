import type { Metadata } from "next";
import PageHeader from "../../components/PageHeader";

export const metadata: Metadata = {
  title: "식용 유지",
  description: "참기름, 들기름, 향미유 등 식용유지 제품 — 참깨·들깨 계열 전 품목.",
};

const GROUPS = [
  {
    t: "참깨 / 참기름",
    items: [
      "참기름 (통참깨 100%)",
      "참기름 (볶은참깨가루 100%)",
      "참진한 향기름 (향미유 97%)",
      "참맛기름 (향미유 89%)",
      "고소한 볶은참깨 (참깨 100%)",
      "볶은 검은참깨 (검은참깨 100%)",
    ],
  },
  {
    t: "들깨 / 들기름 / 향미유",
    items: [
      "들기름 (볶음들깨 100%)",
      "들향기름 (향미유 93%)",
      "매운 고추씨맛기름 (향미유 90%)",
      "들깨 가루 (볶음들깨 100%)",
      "들깨 기피 가루 (들깨 기피 100%)",
    ],
  },
];

export default function OilPage() {
  return (
    <>
      <PageHeader title="참기름 / 들기름" section="제품소개" current="/products/oil" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid gap-12 md:grid-cols-[1fr_380px] md:items-start">
          <div className="space-y-10">
            {GROUPS.map((g) => (
              <div key={g.t}>
                <h2 className="border-b-2 border-ink pb-2 text-[18px] font-extrabold">{g.t}</h2>
                <ul className="mt-4">
                  {g.items.map((it) => (
                    <li key={it} className="flex gap-3 border-b border-line py-3 text-[14px]">
                      <span aria-hidden="true" className="text-brand">·</span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/products/oil-1.jpg" alt="참기름·들기름 제품" className="content-img" loading="lazy" width={1500} height={1000} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/products/oil-hero.jpg" alt="식용 유지 제품군" className="content-img" loading="lazy" width={2500} height={1400} />
          </div>
        </div>
      </section>
    </>
  );
}
