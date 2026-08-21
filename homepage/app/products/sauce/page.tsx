import type { Metadata } from "next";
import PageHeader from "../../components/PageHeader";

export const metadata: Metadata = {
  title: "소스 / 육수",
  description: "칼국수·쌀국수·냉면·한우사골·짬뽕·마라 육수 베이스와 각종 소스류 OEM 제조.",
};

const GROUPS = [
  {
    t: "육수 베이스",
    items: [
      "칼국수 육수 베이스",
      "쌀국수 육수 베이스",
      "냉면 육수 베이스",
      "한우사골 베이스 [2-3brix]",
      "짬뽕 소스 베이스",
      "마라 육수 베이스",
      "마라로제 육수 베이스",
      "멸치 육수 베이스",
    ],
  },
  {
    t: "소스류",
    items: [
      "칠리 소스",
      "절임용 간장 소스",
      "파 다대기",
      "비빔소스",
      "찍어먹는 간장소스",
      "불고기 소스",
    ],
  },
];

export default function SaucePage() {
  return (
    <>
      <PageHeader
        title="소스 / 육수"
        section="제품소개"
        current="/products/sauce"
        lead="한식·중식·일식·동남아식 소스 및 육수를 배합부터 충진까지 제조합니다."
      />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid gap-12 md:grid-cols-[1fr_360px] md:items-start">
          <div className="grid gap-10 sm:grid-cols-2">
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

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/products/sauce-1.png"
            alt="소스·육수 제품"
            className="content-img"
            loading="lazy"
            width={1500}
            height={1000}
          />
        </div>
      </section>
    </>
  );
}
