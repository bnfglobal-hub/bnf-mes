import Link from "next/link";

const STATS = [
  { n: "1990", l: "창업 이래 34년", d: "종합식품회사로 출발" },
  { n: "7건", l: "HACCP 인증", d: "품목군별 안전관리인증" },
  { n: "2,000+", l: "취급 품목", d: "수산·축산·식자재" },
  { n: "100%", l: "풀 콜드체인", d: "수도권 자체 물류 직배송" },
];

const BUSINESS = [
  {
    t: "식품 제조",
    d: "HMR(국·탕류, 밀키트), 소스·육수, 숙면, 수산물가공품, 절임식품, 양념육 등을 이천 HACCP 공장에서 B2B/B2C, OEM/ODM으로 제조합니다.",
    href: "/products",
  },
  {
    t: "무역",
    d: "참깨분·농수산물 가공품 직수입 및 수입대행, HMR 가공식품 수출까지 — 식품 원료의 들고 나는 길을 직접 운영합니다.",
    href: "/business",
  },
  {
    t: "유통",
    d: "냉동 수산물·축산물과 식용유지, 밀가루 등 2,000여 품목을 공급하는 식자재 전문 유통.",
    href: "/business",
  },
  {
    t: "물류",
    d: "서울·경기 수도권 자체 물류 직배송, 풀 콜드체인 시스템(Full Cold Chain System)으로 신선함을 지킵니다.",
    href: "/business",
  },
];

const DISHES = [
  { src: "/food-pho.png", n: "태국 소고기 쌀국수", c: "HMR 냉동 밀키트" },
  { src: "/food-galbitang.png", n: "갈비탕", c: "식육추출가공품" },
  { src: "/food-uyuktang.png", n: "우육탕면", c: "HMR 냉동 밀키트" },
  { src: "/food-buncha.png", n: "분짜", c: "면류(숙면)" },
];

const OEM_STEPS = [
  { t: "상담", d: "품목·수량·포장 형태를 듣고 가능 여부와 방향을 잡습니다." },
  { t: "레시피·배합 개발", d: "기업부설연구소가 시료를 만들며 맛과 원가를 조율합니다." },
  { t: "시제품", d: "실제 양산 라인 기준의 샘플로 관능·품질을 확인합니다." },
  { t: "HACCP 양산", d: "금속검출·중량선별 전수 검사, 영하 38℃ 급속 냉동." },
  { t: "납품·물류", d: "풀 콜드체인 직배송 또는 지정 물류로 인도합니다." },
];

export default function Home() {
  return (
    <>
      {/* ── 히어로: 철학 문장 + 실제 제품 사진 ── */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-16 md:grid-cols-[1.15fr_1fr] md:pb-20 md:pt-24">
          <div>
            <p className="kicker rise">Since 1990 · Food Manufacturing &amp; Trading</p>
            <h1 className="rise mt-5 text-[clamp(2rem,5vw,3.8rem)] font-extrabold leading-[1.16] tracking-[-0.035em]">
              고객의 식탁에 오르는
              <br />
              모든 식재료는{" "}
              <span className="text-brand">
                건강하고
                <br className="hidden sm:block" /> 신뢰할 수 있어야 한다
              </span>
            </h1>
            <p
              className="rise mt-6 max-w-xl text-[15.5px] leading-relaxed text-muted"
              style={{ animationDelay: "0.08s" }}
            >
              ㈜비엔에프글로벌은 이 한 문장의 철학으로 34년을 걸어왔습니다.
              식품의 수입·수출·제조·유통·물류를 아우르며, 철저한 품질 관리와
              체계적인 시스템으로 안전한 식품을 공급합니다.
            </p>
            <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "0.14s" }}>
              <Link
                href="/contact"
                className="rounded-md bg-brand px-6 py-3.5 text-[14.5px] font-bold text-white transition-colors hover:bg-brand-deep"
              >
                OEM 제조 견적 문의
              </Link>
              <Link
                href="/company"
                className="rounded-md border border-line-strong px-6 py-3.5 text-[14.5px] font-semibold text-ink transition-colors hover:border-ink"
              >
                회사소개 보기
              </Link>
            </div>
          </div>

          {/* 실제 제조 제품 — 소이연남 태국 소고기 쌀국수 */}
          <figure className="rise relative" style={{ animationDelay: "0.1s" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/food-pho.png"
              alt="이천 공장에서 제조한 태국 소고기 쌀국수 완성 조리 사진"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-[0_24px_60px_-24px_rgba(21,25,30,0.35)]"
              width={750}
              height={498}
            />
            <figcaption className="absolute bottom-4 left-4 rounded-md bg-white/85 px-3.5 py-2 text-[12px] font-bold backdrop-blur-sm">
              태국 소고기 쌀국수 <span className="ml-1 font-semibold text-muted">이천 공장 제조 · HMR 밀키트</span>
            </figcaption>
          </figure>
        </div>

        {/* 신뢰 지표 스트립 */}
        <div className="border-t border-line bg-surface">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-line md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l} className="px-5 py-7 md:px-8">
                <dd className="text-[2rem] font-extrabold tracking-tight text-ink tabular-nums">
                  {s.n}
                </dd>
                <dt className="mt-1 text-[13px] font-bold text-ink">{s.l}</dt>
                <p className="mt-0.5 text-[12px] text-muted">{s.d}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── 사업분야 ── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="kicker">Business</p>
        <h2 className="mt-3 text-[1.75rem] font-extrabold tracking-tight">
          원료에서 식탁까지, 네 개의 사업이 하나의 사슬로
        </h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          {BUSINESS.map((b, i) => (
            <Link
              key={b.t}
              href={b.href}
              className="group bg-surface p-7 transition-colors hover:bg-brand-soft/40"
            >
              <span className="text-[12px] font-bold text-faint tabular-nums">0{i + 1}</span>
              <h3 className="mt-2 text-[17px] font-extrabold tracking-tight group-hover:text-brand-deep">
                {b.t}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{b.d}</p>
              <span className="mt-4 inline-block text-[13px] font-semibold text-brand">
                자세히 보기 →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 전폭 포토 밴드: 우리가 만드는 것 (리듬 전환) ── */}
      <section aria-labelledby="dishes-h" className="border-y border-line bg-ink">
        <div className="mx-auto max-w-6xl px-5 pb-4 pt-16">
          <p className="kicker">What We Make</p>
          <h2 id="dishes-h" className="mt-3 text-[1.75rem] font-extrabold tracking-tight text-white">
            말보다 그릇이 정확합니다
          </h2>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-white/60">
            아래는 전부 이천 공장에서 실제로 제조하는 제품입니다.
            사진 속 그대로, 같은 배합과 같은 공정으로 납품됩니다.
          </p>
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-5 pb-16 pt-8 lg:grid-cols-4">
          {DISHES.map((d) => (
            <figure key={d.n}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.src}
                alt={`${d.n} 완성 조리 사진`}
                className="aspect-square w-full rounded-xl object-cover"
                loading="lazy"
                width={375}
                height={375}
              />
              <figcaption className="mt-2.5">
                <span className="block text-[14px] font-bold text-white">{d.n}</span>
                <span className="block text-[12px] text-white/50">{d.c}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── 품질/투명 섹션 ── */}
      <section className="border-b border-line bg-trust-soft">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
          <div>
            <p className="kicker">Quality &amp; Transparency</p>
            <h2 className="mt-3 text-[1.75rem] font-extrabold tracking-tight">
              보여드릴 수 있는 품질만 만듭니다
            </h2>
            <p className="mt-4 text-[14.5px] leading-relaxed text-muted">
              품목군별 HACCP 인증 7건, 기업부설연구소, 벤처기업·이노비즈 확인,
              특허 2건 — 원재료 전처리부터 금속검출·중량선별·급속냉동까지
              전 공정을 기준으로 관리하고, 그 근거를 문서로 남깁니다.
            </p>
            <ul className="mt-6 space-y-2.5 text-[13.5px] font-semibold text-ink">
              {[
                "즉석조리식품 · 소스 · 면류(숙면) · 절임식품 · 수산물가공품 · 식육추출가공품 HACCP",
                "영하 38℃ 급속 냉동 → 영하 18℃ 냉동 보관 콜드체인",
                "금속검출기 · 중량선별기 전수 통과",
                "기업부설연구소 보유 — 자체 배합·공정 개발",
                "간장게장·중식당·곱창·샤브샤브 프랜차이즈 런칭으로 검증된 외식 현장 경험",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-0.5 text-brand">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          {/* 실제 인증서 — 신뢰의 물증 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/certs.jpg"
            alt="HACCP 적용업소 인증서 6종, 기업부설연구소 인정서, 벤처기업확인서, 이노비즈 확인서, 특허증 2건"
            className="h-auto w-full rounded-xl border border-line bg-white p-4 shadow-sm"
            loading="lazy"
            width={727}
            height={891}
          />
        </div>
      </section>

      {/* ── OEM 진행 절차 ── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-10 md:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="kicker">How It Works</p>
            <h2 className="mt-3 text-[1.75rem] font-extrabold tracking-tight">
              문의하면
              <br />
              이렇게 진행됩니다
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-muted">
              제품 기획 단계라도 좋습니다. 3g 분말부터 5kg 진공포장까지,
              레시피 상담에서 양산까지 다섯 단계로 함께합니다.
            </p>
            <Link
              href="/contact"
              className="mt-7 inline-block rounded-md bg-brand px-6 py-3.5 text-[14.5px] font-bold text-white transition-colors hover:bg-brand-deep"
            >
              OEM 제조 견적 문의하기
            </Link>
          </div>
          <ol className="space-y-0">
            {OEM_STEPS.map((s, i) => (
              <li key={s.t} className="flex gap-6 border-b border-line py-5 first:pt-0 last:border-b-0">
                <span className="w-8 shrink-0 pt-0.5 text-[1.3rem] font-extrabold text-brand tabular-nums">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[15px] font-extrabold">{s.t}</h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
