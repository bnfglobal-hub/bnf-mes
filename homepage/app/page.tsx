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

export default function Home() {
  return (
    <>
      {/* ── 히어로: 회사 철학이 곧 첫 화면 ── */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-20 md:pb-24 md:pt-28">
          <p className="kicker rise">Since 1990 · Food Manufacturing &amp; Trading</p>
          <h1 className="rise mt-5 max-w-3xl text-[clamp(1.9rem,4.6vw,3.4rem)] font-extrabold leading-[1.22] tracking-[-0.03em]">
            고객의 식탁에 오르는
            <br />
            모든 식재료는{" "}
            <span className="text-brand">건강하고
            <br className="hidden sm:block" /> 신뢰할 수 있어야 한다</span>
          </h1>
          <p className="rise mt-6 max-w-xl text-[15.5px] leading-relaxed text-muted" style={{ animationDelay: "0.08s" }}>
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

        {/* 신뢰 지표 스트립 */}
        <div className="border-t border-line bg-surface">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-line md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l} className="px-5 py-7 md:px-8">
                <dd className="text-[1.7rem] font-extrabold tracking-tight text-ink tabular-nums">
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
        <h2 className="mt-3 text-[1.65rem] font-extrabold tracking-tight">
          원료에서 식탁까지, 네 개의 사업이 하나의 사슬로
        </h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          {BUSINESS.map((b, i) => (
            <Link
              key={b.t}
              href={b.href}
              className="group bg-surface p-7 transition-colors hover:bg-brand-soft/40"
            >
              <span className="text-[12px] font-bold text-faint tabular-nums">
                0{i + 1}
              </span>
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

      {/* ── 품질/투명 섹션 ── */}
      <section className="border-y border-line bg-trust-soft">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
          <div>
            <p className="kicker">Quality &amp; Transparency</p>
            <h2 className="mt-3 text-[1.65rem] font-extrabold tracking-tight">
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
            className="w-full rounded-xl border border-line bg-white p-4 shadow-sm"
            loading="lazy"
          />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="text-[1.65rem] font-extrabold tracking-tight">
          만들고 싶은 제품이 있으신가요?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[14.5px] text-muted">
          3g 분말부터 5kg 진공포장까지 — 레시피 상담부터 양산까지
          OEM/ODM 전 과정을 함께합니다.
        </p>
        <Link
          href="/contact"
          className="mt-7 inline-block rounded-md bg-brand px-8 py-4 text-[15px] font-bold text-white transition-colors hover:bg-brand-deep"
        >
          OEM 제조 견적 문의하기
        </Link>
      </section>
    </>
  );
}
