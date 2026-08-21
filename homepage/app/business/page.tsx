import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "사업분야",
  description: "무역·유통·물류·제조 — ㈜비엔에프글로벌의 4대 사업분야와 식품 제조 프로세스.",
};

const AREAS = [
  {
    t: "무역",
    tag: "직수입 및 수입대행 · 수출",
    rows: [
      { k: "수입", v: "참깨분, 농산물 가공품, 수산물 가공품 등" },
      { k: "수출", v: "HMR(가정간편식) 가공식품 수출" },
    ],
  },
  {
    t: "유통",
    tag: "식자재 전문 유통 · 2,000여 품목",
    rows: [
      { k: "냉동 수산물", v: "아귀, 낙지, 쭈꾸미, 새우, 꽃게, 대구두, 오징어 등" },
      { k: "냉동 축산물", v: "소고기, 돼지고기, 부산물(곱창·대창·깐양 등), 특수부위(닭 목살, 닭 가슴살 연골 등)" },
      { k: "기타 식자재", v: "참기름·들기름·향미유, 밀가루(우리밀·강력분·중력분·박력분) 등" },
    ],
  },
  {
    t: "물류",
    tag: "Full Cold Chain System",
    rows: [
      { k: "직배송", v: "프랜차이즈 및 일반 영업소 식자재 물류 — 서울·경기 수도권 자체 물류 직배송" },
      { k: "콜드체인", v: "입고부터 배송까지 전 구간 냉장·냉동 온도 관리" },
    ],
  },
  {
    t: "제조",
    tag: "B2B/B2C · OEM/ODM",
    rows: [
      { k: "품목", v: "HMR(국·탕류, 밀키트), 소스·육수, 숙면, 절임식품, 수산물가공품, 축산물 가공품 등" },
      { k: "공장", v: "경기 이천 HACCP 인증 제조공장" },
    ],
  },
];

const PROCESS = [
  "원재료 전처리 및 계량",
  "이물 선별",
  "육수/소스 추출 및 배합",
  "충진 및 내포장",
  "금속검출기 통과",
  "중량 선별기 통과",
  "영하 38℃ 이하 급속 냉동",
  "외포장",
  "영하 18℃ 이하 냉동 보관",
];

const PACKAGING = [
  { k: "분말·과립", v: "3g, 10g, 200g~5kg" },
  { k: "즉석조리식품·소스·육수·절임식품·수산물가공품", v: "30~100g, 100~200g, 300~400g, 400g~1kg, 2kg~5kg" },
  { k: "냉동 숙면류", v: "130g~150g" },
  { k: "멀티팩 진공포장", v: "100g~200g" },
  { k: "진공포장", v: "100g~5kg" },
];

export default function BusinessPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="kicker">Business</p>
          <h1 className="mt-3 text-[2rem] font-extrabold tracking-tight">사업분야</h1>
          <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-muted">
            원료의 수입에서 제조, 유통, 그리고 문 앞까지의 물류 —
            식품이 지나는 모든 길을 한 회사가 책임집니다.
          </p>

          <div className="mt-12 space-y-8">
            {AREAS.map((a, i) => (
              <article key={a.t} className="grid gap-5 rounded-xl border border-line bg-surface p-7 md:grid-cols-[180px_1fr] md:p-9">
                <header>
                  <span className="text-[12px] font-bold text-faint tabular-nums">0{i + 1}</span>
                  <h2 className="mt-1 text-[19px] font-extrabold tracking-tight">{a.t}</h2>
                  <p className="mt-1 text-[12.5px] font-semibold text-brand">{a.tag}</p>
                </header>
                <dl className="space-y-3 border-line md:border-l md:pl-8">
                  {a.rows.map((r) => (
                    <div key={r.k} className="grid gap-0.5 sm:grid-cols-[150px_1fr]">
                      <dt className="text-[13.5px] font-bold">{r.k}</dt>
                      <dd className="text-[13.5px] leading-relaxed text-muted">{r.v}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 제조 프로세스 */}
      <section className="border-b border-line bg-trust-soft">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="kicker">Process</p>
          <h2 className="mt-3 text-[1.65rem] font-extrabold tracking-tight">
            식품 제조 프로세스
          </h2>
          <p className="mt-3 max-w-lg text-[14px] text-muted">
            아홉 단계의 관리 기준 — 이물 선별과 금속검출·중량선별을 전수로
            거쳐, 영하 38℃ 급속 냉동으로 맛과 안전을 함께 봉인합니다.
          </p>
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROCESS.map((p, i) => (
              <li key={p} className="flex items-center gap-4 rounded-lg border border-line bg-surface px-5 py-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-brand text-[13px] font-extrabold text-brand tabular-nums">
                  {i + 1}
                </span>
                <span className="text-[14px] font-semibold">{p}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 포장 형태·규격 */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="kicker">Packaging</p>
        <h2 className="mt-3 text-[1.65rem] font-extrabold tracking-tight">포장 형태와 가능 규격</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div className="space-y-5">
            <article className="rounded-xl border border-line bg-surface p-6">
              <h3 className="text-[15px] font-extrabold">RTH (Ready to Heat) · 원팩</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                한 개의 파우치 안에 육수/소스와 고형물(야채·고기 등)이 모두 담긴
                형태 — 간단하게 데워서 바로 먹는 제품에 적합합니다.
              </p>
            </article>
            <article className="rounded-xl border border-line bg-surface p-6">
              <h3 className="text-[15px] font-extrabold">RTC (Ready to Cook) · 밀키트</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                각각의 구성품을 하나의 패키지에 담아 포장하는 형태 — 간단한
                조리를 거치는 제품에 적합합니다.
              </p>
            </article>
            <article className="rounded-xl border border-line bg-surface p-6">
              <h3 className="text-[15px] font-extrabold">기타 포장</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                캡파우치 · 삼방 파우치 · 트레이 포장
              </p>
            </article>
          </div>
          <div>
            <table className="w-full overflow-hidden rounded-xl border border-line text-left text-[13.5px]">
              <caption className="sr-only">포장 가능 규격표</caption>
              <thead>
                <tr className="bg-trust-soft text-[12.5px] uppercase tracking-wide text-trust">
                  <th scope="col" className="px-5 py-3.5 font-bold">유형</th>
                  <th scope="col" className="px-5 py-3.5 font-bold">가능 규격</th>
                </tr>
              </thead>
              <tbody>
                {PACKAGING.map((p) => (
                  <tr key={p.k} className="border-t border-line bg-surface">
                    <th scope="row" className="px-5 py-3.5 align-top font-bold">{p.k}</th>
                    <td className="px-5 py-3.5 text-muted tabular-nums">{p.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-5 text-[13px] text-muted">
              원하는 규격이 목록에 없다면{" "}
              <Link href="/contact" className="font-bold text-brand underline underline-offset-2">
                OEM 견적 문의
              </Link>
              로 알려주세요. 설비 기준으로 가능 여부를 확인해 드립니다.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
