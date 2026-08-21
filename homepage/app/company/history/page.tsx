import type { Metadata } from "next";
import PageHeader from "../../components/PageHeader";

export const metadata: Metadata = {
  title: "회사연혁",
  description: "1990년 설립부터 2024년 이천공장 축산물 HACCP 인증까지 — ㈜비엔에프글로벌 연혁.",
};

const HISTORY: { y: string; e: string[] }[] = [
  { y: "1990", e: ["경기 파주 이조식품 설립", "면류 제조 및 식품 유통"] },
  { y: "2002", e: ["㈜비엔에프글로벌 법인 설립"] },
  {
    y: "2009",
    e: [
      "냉동 수산물 수입 및 유통, 식자재 물류 사업",
      "간장게장, 중식당, 곱창 전문점, 샤브샤브 등 프랜차이즈 런칭",
    ],
  },
  { y: "2013", e: ["수산물 가공 및 축산물 유통"] },
  { y: "2014", e: ["밀가루 유통"] },
  { y: "2015", e: ["경기 하남 제조 공장 HACCP인증 취득", "절임식품, 수산물 가공품 제조"] },
  { y: "2017", e: ["경기 양주 제조공장 신설 및 HACCP인증 취득", "숙면 쌀국수 제조"] },
  { y: "2019", e: ["경기 하남 제조공장 HMR 제조 및 유통", "HMR(가정간편식), 냉동 밀키트 제조"] },
  {
    y: "2020",
    e: [
      "경기 이천 제조공장 신설 및 HACCP인증 취득",
      "HMR(가정간편식), 냉동 밀키트, 숙면(냉동), 소스, 수산물가공품, 절임식품, 축산물(식육추출가공품, 양념육) 등 제조",
    ],
  },
  { y: "2023", e: ["참깨분 수입 및 식용유지(참기름, 향미유 등) 유통"] },
  { y: "2024", e: ["경기 이천 제조공장 축산물(식육추출가공품, 양념육) HACCP인증 취득"] },
];

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="회사연혁" section="회사소개" current="/company/history" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <ol className="max-w-3xl">
          {HISTORY.map((h) => (
            <li key={h.y} className="flex gap-6 border-b border-line py-6 last:border-b-0 sm:gap-10">
              <span className="w-[62px] shrink-0 text-[20px] font-extrabold leading-tight text-brand tabular-nums sm:text-[22px]">
                {h.y}
              </span>
              <div className="space-y-1 pt-0.5 text-[14.5px] leading-relaxed">
                {h.e.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
