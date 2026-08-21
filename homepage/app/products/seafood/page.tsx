import type { Metadata } from "next";
import PageHeader from "../../components/PageHeader";

export const metadata: Metadata = {
  title: "수산물가공품 / 절임식품",
  description: "간장게장, 양념게장, 전복장, 송이장, 새우장, 쭈꾸미 볶음, 해물모듬 등.",
};

const ITEMS = [
  { n: "간장게장", img: "/products/sea1.png" },
  { n: "양념게장", img: "/products/sea2.jpg" },
  { n: "전복장", img: "/products/sea3.png" },
  { n: "송이장", img: "/products/sea4.jpg" },
  { n: "새우장", img: "/products/sea5.jpg" },
  { n: "쭈꾸미 볶음", img: "/products/sea6.jpg" },
  { n: "해물모듬 7종", img: "/products/sea7.jpg" },
  { n: "손질 가자미 120g", img: "/products/sea8.jpg" },
  { n: "순살고등어 170g", img: "/products/sea9.png" },
];

export default function SeafoodPage() {
  return (
    <>
      <PageHeader
        title="수산물가공품 & 절임식품"
        section="제품소개"
        current="/products/seafood"
      />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3">
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
              <p className="mt-3 text-[14px] font-bold">{it.n}</p>
            </li>
          ))}
        </ul>

        <div className="mt-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/products/sea-hero.png"
            alt="수산물가공품 및 절임식품 제품군"
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
