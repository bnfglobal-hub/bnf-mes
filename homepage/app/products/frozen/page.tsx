import type { Metadata } from "next";
import PageHeader from "../../components/PageHeader";

export const metadata: Metadata = {
  title: "냉동 수산 / 축산물",
  description: "냉동 수산물 500여 품목, 냉동 축산물 30여 품목, 냉동 식품 50여 품목, 기타 공산품 120여 품목.",
};

const CATS = [
  {
    t: "냉동 수산물",
    n: "500여 품목",
    d: "오징어 / 낙지 / 아귀 / 새우 / 꽃게 / 쭈꾸미 / 갑각류 / 해물믹스 등",
    f: "원물 · 절단가공 · 혼합제품",
  },
  {
    t: "냉동 축산물",
    n: "30여 품목",
    d: "쇠고기 / 돼지고기 / 이베리코 등",
    f: "원물 · 절단가공",
  },
  {
    t: "냉동 식품",
    n: "50여 품목",
    d: "만두 / 전병 / 돈까스 / 고로케 / 간편식 등",
    f: "업소용 벌크 제품",
  },
  {
    t: "기타 공산품",
    n: "120여 품목",
    d: "업소용 식자재 공산품",
    f: "",
  },
];

export default function FrozenPage() {
  return (
    <>
      <PageHeader title="냉동 수산 / 축산물" section="제품소개" current="/products/frozen" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <ul className="grid gap-5 sm:grid-cols-2">
          {CATS.map((c) => (
            <li key={c.t} className="border border-line p-7">
              <div className="flex items-baseline gap-3">
                <h2 className="text-[19px] font-extrabold">{c.t}</h2>
                <span className="text-[13px] font-bold text-brand tabular-nums">{c.n}</span>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{c.d}</p>
              {c.f && (
                <p className="mt-3 inline-block bg-surface-2 px-3 py-1.5 text-[12.5px] font-bold text-muted">
                  {c.f}
                </p>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/products/frozen-hero.jpg"
            alt="냉동 수산물·축산물 제품"
            className="content-img"
            loading="lazy"
            width={2500}
            height={1400}
          />
        </div>
      </section>
    </>
  );
}
