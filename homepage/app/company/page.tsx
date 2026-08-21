import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회사소개",
  description: "㈜비엔에프글로벌 인사말, 1990년부터의 연혁, HACCP 등 인증 현황.",
};

const HISTORY: { y: string; e: string[] }[] = [
  { y: "1990", e: ["경기 파주 이조식품 설립", "면류 제조 및 식품 유통"] },
  { y: "2002", e: ["㈜비엔에프글로벌 법인 설립"] },
  { y: "2009", e: ["냉동 수산물 수입 및 유통, 식자재 물류 사업", "간장게장·중식당·곱창 전문점·샤브샤브 등 프랜차이즈 런칭"] },
  { y: "2013", e: ["수산물 가공 및 축산물 유통"] },
  { y: "2014", e: ["밀가루 유통"] },
  { y: "2015", e: ["경기 하남 제조공장 HACCP 인증 취득", "절임식품·수산물 가공품 제조"] },
  { y: "2017", e: ["경기 양주 제조공장 신설 및 HACCP 인증 취득", "숙면 쌀국수 제조"] },
  { y: "2019", e: ["경기 하남 제조공장 HMR 제조 및 유통", "HMR(가정간편식)·냉동 밀키트 제조"] },
  { y: "2020", e: ["경기 이천 제조공장 신설 및 HACCP 인증 취득", "HMR·냉동 밀키트·숙면(냉동)·소스·수산물가공품·절임식품·축산물(식육추출가공품, 양념육) 제조"] },
  { y: "2023", e: ["참깨분 수입 및 식용유지(참기름·향미유 등) 유통"] },
  { y: "2024", e: ["경기 이천 제조공장 축산물(식육추출가공품, 양념육) HACCP 인증 취득"] },
];

const CERTS = [
  "즉석조리식품 HACCP 인증",
  "소스 HACCP 인증",
  "면류(숙면) HACCP 인증",
  "절임식품 HACCP 인증",
  "수산물가공품 HACCP 인증",
  "식육추출가공품·양념육 HACCP 인증",
  "기업부설연구소 인정",
  "벤처기업 확인",
  "기술혁신형 중소기업(Inno-Biz) 확인",
  "특허 2건 등록",
];

export default function CompanyPage() {
  return (
    <>
      {/* 인사말 */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="kicker">About Us</p>
          <h1 className="mt-3 text-[2rem] font-extrabold tracking-tight">
            새로운 식품문화를 선도합니다
          </h1>
          <div className="mt-8 grid gap-10 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5 text-[15px] leading-[1.85] text-ink">
              <p>
                ㈜비엔에프글로벌은 1990년 종합식품회사로 출발하여{" "}
                <strong className="font-bold">
                  &ldquo;고객의 식탁에 오르는 모든 식재료는 건강하고 신뢰할 수
                  있어야 한다&rdquo;
                </strong>
                는 철학을 바탕으로 성장해왔습니다.
              </p>
              <p>
                당사는 식품 수입·수출·제조·유통·물류 사업을 영위하며, 철저한
                품질 관리와 체계적인 시스템을 통해 안전하고 신뢰할 수 있는
                식품을 공급하고 있습니다.
              </p>
              <p>
                ㈜비엔에프글로벌은 변화하는 식문화 속에서도 소비자와 고객사의
                신뢰를 바탕으로 건강하고 즐거운 식문화를 선도하는 기업이
                되겠습니다.
              </p>
              <p className="pt-2 text-[14px] text-muted">
                ㈜비엔에프글로벌 대표이사 <strong className="text-ink">이용재</strong>
              </p>
            </div>
            <aside className="rounded-xl border border-line bg-trust-soft p-7 text-[13.5px] leading-loose">
              <h2 className="text-[12px] font-bold uppercase tracking-widest text-trust">
                At a Glance
              </h2>
              <dl className="mt-3 space-y-2">
                <div><dt className="inline font-bold">설립 — </dt><dd className="inline text-muted">1990년 (법인 설립 2002년)</dd></div>
                <div><dt className="inline font-bold">사업 — </dt><dd className="inline text-muted">식품 제조·무역·유통·물류</dd></div>
                <div><dt className="inline font-bold">본사 — </dt><dd className="inline text-muted">경기 하남시 산곡로 8</dd></div>
                <div><dt className="inline font-bold">공장 — </dt><dd className="inline text-muted">경기 이천시 백사면 이여로 260-15</dd></div>
                <div><dt className="inline font-bold">인증 — </dt><dd className="inline text-muted">품목군별 HACCP 7건 외</dd></div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      {/* 연혁 */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="kicker">History</p>
          <h2 className="mt-3 text-[1.65rem] font-extrabold tracking-tight">
            1990 → 오늘, 한 해도 멈추지 않은 확장
          </h2>
          <ol className="mt-10 max-w-2xl">
            {HISTORY.map((h) => (
              <li key={h.y} className="relative flex gap-7 pb-9 last:pb-0">
                <span className="w-14 shrink-0 pt-0.5 text-right text-[15px] font-extrabold text-brand tabular-nums">
                  {h.y}
                </span>
                <span aria-hidden="true" className="relative mt-2 h-2 w-2 shrink-0 rounded-full bg-brand before:absolute before:left-1/2 before:top-3 before:h-full before:w-px before:-translate-x-1/2 before:bg-line" />
                <div className="text-[14px] leading-relaxed text-ink">
                  {h.e.map((line) => (
                    <p key={line} className="[&:not(:first-child)]:mt-0.5 [&:not(:first-child)]:text-muted">
                      {line}
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 인증 */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="kicker">Certifications</p>
        <h2 className="mt-3 text-[1.65rem] font-extrabold tracking-tight">인증 현황</h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CERTS.map((c) => (
            <li key={c} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-5 py-4 text-[13.5px] font-semibold">
              <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-[12px] text-brand">✓</span>
              {c}
            </li>
          ))}
        </ul>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/certs.jpg"
          alt="HACCP 인증서 6종과 기업부설연구소 인정서, 벤처기업확인서, 이노비즈 확인서, 특허증 원본 이미지"
          className="mt-10 w-full rounded-xl border border-line bg-white p-4"
          loading="lazy"
        />
      </section>
    </>
  );
}
