import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "제조품목",
  description: "HMR, 소스·육수, 면류, 절임식품, 수산물·축산물 가공품 등 ㈜비엔에프글로벌 제조품목 (B2B/B2C, OEM/ODM).",
};

const ITEMS = [
  { t: "HMR — 국·탕류, 즉석조리식품", d: "육개장, 청국장, 된장찌개, 마라탕, 전복죽 등" },
  { t: "HMR — 냉동 밀키트", d: "쌀국수, 짬뽕, 수제비, 낙곱새, 일식 라멘, 우육탕 면 등" },
  { t: "면류 (숙면)", d: "쌀국수 면 — 분짜·퍼" },
  { t: "소스 및 육수", d: "한식, 중식, 일식, 동남아식 소스 및 육수" },
  { t: "절임식품", d: "간장 새우장, 낙지장, 전복장, 간장게장 등" },
  { t: "수산물 가공품", d: "쭈꾸미 볶음, 낙지볶음, 해물 모듬 등" },
  { t: "축산물 가공품 — 식육추출가공품", d: "사골육수, 갈비탕 등" },
  { t: "축산물 가공품 — 양념육", d: "돼지 불고기, 소불고기, 닭갈비 등" },
  { t: "당류가공품", d: "요거트 파우더, 빙수 파우더 등" },
  { t: "기타 가공품", d: "분말 시즈닝, 프리믹스 등" },
];

export default function ProductsPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="kicker">Products · B2B/B2C · OEM/ODM</p>
          <h1 className="mt-3 text-[2rem] font-extrabold tracking-tight">식품 제조 품목</h1>
          <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-muted">
            이천 HACCP 인증 공장에서 열 개 품목군을 제조합니다. 모든 품목은
            자사 브랜드 생산과 OEM/ODM 수탁 생산이 모두 가능합니다.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { src: "/food-pho.png", n: "태국 소고기 쌀국수" },
              { src: "/food-galbitang.png", n: "갈비탕" },
              { src: "/food-uyuktang.png", n: "우육탕면" },
              { src: "/food-buncha.png", n: "분짜" },
            ].map((d) => (
              <figure key={d.n}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.src}
                  alt={`${d.n} 완성 조리 사진`}
                  className="aspect-square w-full rounded-xl border border-line object-cover"
                  loading="lazy"
                  width={375}
                  height={375}
                />
                <figcaption className="mt-2 text-[12.5px] font-bold text-muted">{d.n}</figcaption>
              </figure>
            ))}
          </div>

          <ul className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
            {ITEMS.map((it, i) => (
              <li key={it.t} className="bg-surface p-6">
                <span className="text-[12px] font-bold text-faint tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-1.5 text-[15.5px] font-extrabold tracking-tight">{it.t}</h2>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{it.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-line bg-trust-soft p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-[17px] font-extrabold">완제품을 직접 구매하고 싶다면</h2>
            <p className="mt-1.5 text-[13.5px] text-muted">
              소비자용 제품은 네이버 스마트스토어에서 판매 중입니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://smartstore.naver.com/bnfglobal"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-line-strong bg-surface px-5 py-3 text-[13.5px] font-bold transition-colors hover:border-ink"
            >
              스마트스토어 방문 ↗
            </a>
            <Link
              href="/contact"
              className="rounded-md bg-brand px-5 py-3 text-[13.5px] font-bold text-white transition-colors hover:bg-brand-deep"
            >
              대량 구매·OEM 문의
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
