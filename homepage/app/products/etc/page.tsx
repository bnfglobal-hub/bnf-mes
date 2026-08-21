import type { Metadata } from "next";
import PageHeader from "../../components/PageHeader";

export const metadata: Metadata = {
  title: "기타 가공품",
  description: "마늘후레이크, 반쎄오 프리믹스, 해물찜 분말믹스 등 분말·프리믹스 제품.",
};

const ITEMS = [
  { n: "마늘후레이크", spec: "3g, 4g", img: "/products/etc-1.png" },
  { n: "반쎄오 프리믹스", spec: "500g", img: "/products/etc-2.png" },
  { n: "해물찜 분말믹스", spec: "5kg", img: "/products/etc-hero.jpg" },
];

export default function EtcPage() {
  return (
    <>
      <PageHeader title="기타 가공품" section="제품소개" current="/products/etc" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <ul className="grid gap-6 sm:grid-cols-3">
          {ITEMS.map((it) => (
            <li key={it.n}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.img}
                alt={it.n}
                className="aspect-[4/3] w-full bg-surface-2 object-cover"
                loading="lazy"
                width={500}
                height={375}
              />
              <p className="mt-3 text-[14.5px] font-bold">{it.n}</p>
              <p className="mt-0.5 text-[13px] text-muted tabular-nums">{it.spec}</p>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-[13.5px] text-muted">
          분말 시즈닝·프리믹스는 3g 소분부터 5kg 벌크까지 규격 대응이 가능합니다.
        </p>
      </section>
    </>
  );
}
