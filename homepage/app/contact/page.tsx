import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OEM 견적·문의",
  description: "OEM/ODM 제조 견적과 거래 문의, 본사·제조공장 오시는 길.",
};

const LOCATIONS = [
  {
    n: "본사",
    a: "경기도 하남시 산곡로 8",
    t: "031-794-5071",
    f: "031-794-5009",
    map: "https://map.naver.com/p/search/경기도 하남시 산곡로 8",
  },
  {
    n: "제조공장 (이천)",
    a: "경기도 이천시 백사면 이여로 260-15",
    t: "031-633-1518",
    f: "031-634-6454",
    map: "https://map.naver.com/p/search/경기도 이천시 백사면 이여로 260-15",
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="kicker">Contact · OEM</p>
          <h1 className="mt-3 display text-[clamp(1.9rem,4.5vw,2.8rem)]">
            OEM 견적 · 문의
          </h1>
          <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-muted">
            제품 기획 단계라도 좋습니다. 품목·수량·포장 형태를 알려주시면
            레시피 상담부터 시제품, 양산까지 순서대로 안내해 드립니다.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:max-w-3xl">
            <a
              href="tel:1688-3362"
              className="group rounded-xl border border-line bg-surface p-7 transition-colors hover:border-brand"
            >
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-faint group-hover:text-brand">
                대표번호
              </h2>
              <p className="mt-2 text-[1.6rem] font-extrabold tracking-tight tabular-nums">
                1688-3362
              </p>
              <p className="mt-1 text-[13px] text-muted">평일 09:00 – 18:00</p>
            </a>
            <div className="rounded-xl border border-line bg-surface p-7">
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-faint">
                팩스
              </h2>
              <p className="mt-2 text-[1.6rem] font-extrabold tracking-tight tabular-nums">
                031-794-5009
              </p>
              <p className="mt-1 text-[13px] text-muted">
                견적 요청서 · 제품 사양서 수신
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-line bg-trust-soft p-6 text-[13.5px] leading-relaxed text-muted lg:max-w-3xl">
            <h2 className="mb-1.5 font-bold text-ink">문의 시 이런 내용이 있으면 더 빠릅니다</h2>
            희망 품목(예: 소스, 국·탕류, 밀키트) · 예상 월 수량 · 포장 형태와
            규격(예: 파우치 300g) · 유통 채널(B2B/B2C) · 목표 출시 시기
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="kicker">Directions</p>
        <h2 className="mt-3 display text-[1.55rem]">오시는 길</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {LOCATIONS.map((l) => (
            <article key={l.n} className="rounded-xl border border-line bg-surface p-7">
              <h3 className="text-[16px] font-extrabold">{l.n}</h3>
              <p className="mt-2 text-[14px] text-ink">{l.a}</p>
              <p className="mt-1.5 text-[13.5px] text-muted tabular-nums">
                T. {l.t} · F. {l.f}
              </p>
              <a
                href={l.map}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block rounded-md border border-line-strong px-4 py-2.5 text-[13px] font-bold transition-colors hover:border-ink"
              >
                네이버 지도로 보기 ↗
              </a>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
