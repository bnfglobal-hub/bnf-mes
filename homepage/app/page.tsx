import Link from "next/link";

const STATS = [
  { n: "1990", l: "창업 이래 34년" },
  { n: "7건", l: "품목군별 HACCP 인증" },
  { n: "2,000+", l: "취급 품목" },
  { n: "-38℃", l: "급속 냉동 콜드체인" },
];

const DISHES = [
  { src: "/food-pho.png", n: "태국 소고기 쌀국수", c: "HMR 냉동 밀키트" },
  { src: "/food-galbitang.png", n: "갈비탕", c: "식육추출가공품" },
  { src: "/food-uyuktang.png", n: "우육탕면", c: "HMR 냉동 밀키트" },
  { src: "/food-buncha.png", n: "분짜", c: "면류(숙면)" },
];

const TRUTHS = [
  {
    no: "01",
    bad: "출처를 알 수 없는 원료",
    good: "직수입 원료",
    d: "참깨분·농수산물 가공품을 직접 수입하고, 냉동 수산물·축산물을 자체 유통합니다. 원료가 들어오는 길부터 우리가 운영합니다.",
  },
  {
    no: "02",
    bad: "형식적인 위생 관리",
    good: "품목군별 HACCP 7건",
    d: "즉석조리식품·소스·면류·절임식품·수산물가공품·식육추출가공품까지, 품목군마다 따로 HACCP 인증을 받았습니다.",
  },
  {
    no: "03",
    bad: "눈대중 검사",
    good: "금속검출·중량선별 전수",
    d: "전 제품이 금속검출기와 중량선별기를 통과합니다. 표본이 아니라 전수입니다.",
  },
  {
    no: "04",
    bad: "천천히 얼리는 냉동",
    good: "영하 38℃ 급속 냉동",
    d: "급속 냉동으로 조직과 맛을 그대로 봉인하고, 영하 18℃ 콜드체인으로 문 앞까지 지킵니다.",
  },
];

const FAQS = [
  {
    q: "OEM/ODM 최소 주문 수량이 있나요?",
    a: "품목과 포장 형태에 따라 다릅니다. 3g 분말부터 5kg 진공포장까지 규격 폭이 넓으니, 예상 수량을 알려주시면 상담에서 기준을 안내해 드립니다.",
  },
  {
    q: "레시피가 없어도 의뢰할 수 있나요?",
    a: "가능합니다. 기업부설연구소가 컨셉 단계부터 배합 개발·원가 조율·시제품 제작까지 함께합니다. 기존 레시피의 양산화(ODM→OEM 전환)도 진행합니다.",
  },
  {
    q: "어떤 품목을 만들 수 있나요?",
    a: "HMR 국·탕류, 냉동 밀키트, 소스·육수, 숙면, 절임식품, 수산물가공품, 식육추출가공품·양념육, 분말 시즈닝 등 열 개 품목군을 이천 HACCP 공장에서 제조합니다.",
  },
  {
    q: "납품과 물류는 어떻게 되나요?",
    a: "서울·경기 수도권은 자체 물류로 직배송하며, 전 구간 냉장·냉동 온도를 관리하는 풀 콜드체인 시스템입니다. 그 외 지역은 지정 물류로 인도합니다.",
  },
  {
    q: "진행 절차가 궁금합니다.",
    a: "상담 → 레시피·배합 개발 → 시제품 → HACCP 양산 → 납품·물류의 다섯 단계입니다. 각 단계에서 확인 결과를 공유하고 다음 단계로 넘어갑니다.",
  },
];

export default function Home() {
  return (
    <>
      {/* ── 히어로: 스포트라이트 무대 위의 음식 ── */}
      <section className="stage relative overflow-hidden border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-5 pb-16 pt-14 text-center md:pt-20">
          <p className="kicker rise">Since 1990 · Zero Compromise Food</p>

          <h1 className="display rise mt-6 text-[clamp(2.1rem,6.5vw,4.6rem)]">
            식탁에 오르는 모든 것은
            <br />
            <span className="display-slant inline-block text-brand">
              신뢰할 수 있어야 한다
            </span>
          </h1>

          {/* 주인공: 실제 제조 제품 */}
          <figure className="rise relative mt-10 w-full max-w-xl" style={{ animationDelay: "0.12s" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/food-pho.png"
              alt="이천 공장에서 제조한 태국 소고기 쌀국수 완성 조리 사진"
              className="dish-glow aspect-[3/2] w-full rounded-2xl object-cover"
              width={750}
              height={500}
            />
            <figcaption className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-bg/80 px-4 py-2 text-[12px] font-bold text-ink backdrop-blur-sm">
              태국 소고기 쌀국수
              <span className="ml-2 font-semibold text-muted">이천 HACCP 공장 제조</span>
            </figcaption>
          </figure>

          <p
            className="rise mt-8 max-w-xl text-[15px] leading-relaxed text-muted"
            style={{ animationDelay: "0.18s" }}
          >
            ㈜비엔에프글로벌은 이 한 문장의 철학으로 34년을 걸어온
            종합식품회사입니다. 수입·제조·유통·물류 — 식품이 지나는 모든 길을
            직접 운영합니다.
          </p>

          <div className="rise mt-8 flex flex-wrap justify-center gap-3" style={{ animationDelay: "0.24s" }}>
            <Link
              href="/contact"
              className="rounded-full bg-brand px-7 py-3.5 text-[14.5px] font-bold text-white transition-colors hover:bg-brand-deep"
            >
              OEM 제조 견적 문의
            </Link>
            <Link
              href="/company"
              className="rounded-full border border-line-strong px-7 py-3.5 text-[14.5px] font-semibold text-ink transition-colors hover:border-ink"
            >
              회사소개
            </Link>
          </div>

          <p className="mt-12 text-[11px] font-semibold uppercase tracking-[0.28em] text-faint" aria-hidden="true">
            Scroll to Discover
          </p>
        </div>
      </section>

      {/* ── 품목 티커 ── */}
      <div className="overflow-hidden border-b border-line py-4" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((k) => (
            <span key={k} className="display flex shrink-0 items-center gap-8 pr-8 text-[15px] text-faint">
              {"국·탕류 / 냉동 밀키트 / 소스·육수 / 숙면 / 절임식품 / 수산물가공품 / 식육추출가공품 / 양념육 / 분말 시즈닝 / OEM·ODM /"
                .split(" / ")
                .map((t, i) => (
                  <span key={i} className="flex items-center gap-8">
                    {t !== "" && t}
                    <span className="text-brand">·</span>
                  </span>
                ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── 신뢰 지표 ── */}
      <section className="border-b border-line">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-line md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.l} className="px-5 py-8 text-center md:px-8">
              <dd className="display text-[2.1rem] text-ink tabular-nums">{s.n}</dd>
              <dt className="mt-1.5 text-[12.5px] font-semibold text-muted">{s.l}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ── 투명성 섹션: 나쁜 것에 취소선을 긋는다 ── */}
      <section className="stage-quality border-b border-line" aria-labelledby="truth-h">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <p className="kicker">Radical Transparency</p>
          <h2 id="truth-h" className="display mt-4 max-w-2xl text-[clamp(1.7rem,4vw,2.9rem)]">
            숨길 게 없는 공정만
            <br />
            <span className="display-slant text-brand">운영합니다</span>
          </h2>

          <div className="mt-14 grid gap-x-12 gap-y-12 md:grid-cols-2">
            {TRUTHS.map((t) => (
              <article key={t.no}>
                <span className="text-[12px] font-bold text-faint tabular-nums">{t.no}</span>
                <p className="strike mt-2 w-fit text-[14px]">{t.bad}</p>
                <h3 className="display mt-1.5 text-[1.45rem] text-ink">{t.good}</h3>
                <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-muted">{t.d}</p>
              </article>
            ))}
          </div>

          <p className="mt-14 text-[13px] text-muted">
            근거 서류 — HACCP 인증서 7건 · 기업부설연구소 인정서 · 벤처기업·이노비즈 확인서 · 특허 2건.{" "}
            <Link href="/company" className="font-bold text-ink underline decoration-brand decoration-2 underline-offset-4 hover:text-brand">
              인증서 원본 보기 →
            </Link>
          </p>
        </div>
      </section>

      {/* ── 제품 갤러리: 말보다 그릇 ── */}
      <section aria-labelledby="dishes-h" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 pt-20">
          <p className="kicker">What We Make</p>
          <h2 id="dishes-h" className="display mt-4 text-[clamp(1.7rem,4vw,2.9rem)]">
            말보다 그릇이 <span className="display-slant text-brand">정확합니다</span>
          </h2>
          <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-muted">
            아래는 전부 이천 공장에서 실제로 제조하는 제품입니다. 사진 속
            그대로, 같은 배합과 같은 공정으로 납품됩니다.
          </p>
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-5 pb-20 pt-10 lg:grid-cols-4">
          {DISHES.map((d) => (
            <figure key={d.n} className="group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.src}
                alt={`${d.n} 완성 조리 사진`}
                className="aspect-square w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
                width={375}
                height={375}
              />
              <figcaption className="mt-3">
                <span className="block text-[14.5px] font-extrabold text-ink">{d.n}</span>
                <span className="block text-[12px] text-faint">{d.c}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-b border-line" aria-labelledby="faq-h">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-24 md:grid-cols-[1fr_1.5fr]">
          <div>
            <p className="kicker">FAQ</p>
            <h2 id="faq-h" className="display mt-4 text-[clamp(1.7rem,4vw,2.9rem)]">
              자주 묻는
              <br />
              <span className="display-slant text-brand">질문</span>
            </h2>
            <p className="mt-5 max-w-xs text-[13.5px] leading-relaxed text-muted">
              여기 없는 질문은 전화 한 통이 가장 빠릅니다.
              <br />
              대표번호{" "}
              <a href="tel:1688-3362" className="font-bold text-ink tabular-nums hover:text-brand">
                1688-3362
              </a>
            </p>
          </div>
          <div>
            {FAQS.map((f) => (
              <details key={f.q} className="faq">
                <summary>{f.q}</summary>
                <p className="faq-body">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 파이널 CTA ── */}
      <section className="stage">
        <div className="mx-auto max-w-6xl px-5 py-28 text-center">
          <h2 className="display text-[clamp(2rem,5.5vw,3.6rem)]">
            함께 만들
            <br />
            <span className="display-slant text-brand">준비가 됐습니다</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[14.5px] leading-relaxed text-muted">
            3g 분말부터 5kg 진공포장까지 — 레시피 상담에서 양산, 콜드체인
            납품까지 다섯 단계로 함께합니다.
          </p>
          <Link
            href="/contact"
            className="mt-9 inline-block rounded-full bg-brand px-9 py-4 text-[15px] font-bold text-white transition-colors hover:bg-brand-deep"
          >
            OEM 제조 견적 문의하기
          </Link>
        </div>
      </section>
    </>
  );
}
