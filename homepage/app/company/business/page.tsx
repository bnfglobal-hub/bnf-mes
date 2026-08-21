import type { Metadata } from "next";
import PageHeader from "../../components/PageHeader";

export const metadata: Metadata = {
  title: "사업분야",
  description: "무역(수입·수출), 유통, 물류, 제조 — ㈜비엔에프글로벌의 4대 사업분야.",
};

const AREAS = [
  {
    t: "무역",
    sub: "직수입 및 수입대행",
    rows: [
      { k: "수입", v: "참깨분, 농산물 가공품, 수산물 가공품 등" },
      { k: "수출", v: "HMR(가정간편식) 가공식품 수출" },
    ],
  },
  {
    t: "유통",
    sub: "",
    rows: [
      { k: "냉동 수산물", v: "아귀, 낙지, 쭈꾸미, 새우, 꽃게, 대구두, 오징어 등 200여 품목" },
      {
        k: "냉동 축산물",
        v: "소고기, 돼지고기, 부산물(곱창, 대창, 깐양 등), 특수부위(닭 목살, 닭 가슴살 연골 등)",
      },
      {
        k: "기타 식자재",
        v: "공산품, 참기름, 들기름, 향미유 등 / 밀가루, 우리밀, 강력분, 중력분, 박력분 등",
      },
    ],
  },
  {
    t: "물류",
    sub: "",
    rows: [
      {
        k: "프랜차이즈 및 일반 영업소 식자재 물류",
        v: "서울 / 경기 수도권 자체 물류 직배송 · 풀 콜드체인 시스템(Full Cold Chain System)",
      },
    ],
  },
  {
    t: "제조",
    sub: "B2B / B2C · OEM / ODM",
    rows: [
      {
        k: "제조 품목",
        v: "HMR(국·탕류, 즉석조리식품, 냉동 밀키트), 면류(숙면), 소스 및 육수, 절임식품, 수산물 가공품, 축산물 가공품, 당류가공품, 기타 가공품",
      },
      { k: "제조 공장", v: "경기 이천 HACCP 인증 제조공장" },
    ],
  },
];

export default function BusinessPage() {
  return (
    <>
      <PageHeader title="사업분야" section="회사소개" current="/company/business" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid gap-12 md:grid-cols-[380px_1fr] md:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/company/business.jpg"
            alt="B&F GLOBAL 사업 구조 — 제조, 무역, 유통, 물류"
            className="content-img"
            loading="lazy"
            width={960}
            height={790}
          />

          <div className="space-y-9">
            {AREAS.map((a) => (
              <article key={a.t}>
                <h2 className="border-b-2 border-ink pb-2 text-[19px] font-extrabold">
                  {a.t}
                  {a.sub && (
                    <span className="ml-2.5 text-[13px] font-bold text-muted">{a.sub}</span>
                  )}
                </h2>
                <dl className="mt-4 space-y-4">
                  {a.rows.map((r) => (
                    <div key={r.k}>
                      <dt className="text-[15px] font-bold">{r.k}</dt>
                      <dd className="mt-1 text-[13.5px] leading-relaxed text-muted">{r.v}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
