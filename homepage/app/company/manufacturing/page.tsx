import type { Metadata } from "next";
import PageHeader from "../../components/PageHeader";

export const metadata: Metadata = {
  title: "식품제조",
  description: "식품 제조 프로세스, 제조 품목(B2B/B2C, OEM/ODM), 포장 형태와 가능 규격.",
};

const PROCESS = [
  "원재료 전처리 및 계량",
  "이물 선별",
  "육수/소스 추출 및 배합",
  "육수/소스 충진 및 내포장",
  "금속검출기 통과",
  "중량 선별기 통과",
  "영하 38도 이하 급속 냉동",
  "외포장",
  "영하 18도 이하 냉동보관",
];

const ITEMS = [
  { t: "HMR", s: "(국/탕류, 즉석조리식품)", d: "육개장, 청국장, 된장찌개, 마라탕, 전복죽 등" },
  { t: "HMR", s: "(냉동 밀키트)", d: "쌀국수, 짬뽕, 수제비, 낙곱새, 일식 라멘, 우육탕 면 등" },
  { t: "면류", s: "(숙면)", d: "쌀국수 면(분짜, 퍼)" },
  { t: "소스 및 육수", s: "", d: "한식, 중식, 일식, 동남아식 소스 및 육수" },
  { t: "절임식품", s: "", d: "간장 새우장, 낙지장, 전복장, 간장게장 등" },
  { t: "수산물 가공품", s: "", d: "쭈꾸미 볶음, 낙지볶음, 해물 모듬 등" },
  { t: "축산물 가공품", s: "(식육추출가공품)", d: "사골육수, 갈비탕 등" },
  { t: "축산물 가공품", s: "(양념육)", d: "돼지 불고기, 소불고기, 닭갈비 등" },
  { t: "당류가공품", s: "", d: "요거트 파우더, 빙수 파우더 등" },
  { t: "기타가공품", s: "", d: "분말 시즈닝, 프리믹스 등" },
];

const PACKAGING = [
  { k: "분말, 과립", v: "3g, 10g, 200g~5kg" },
  { k: "즉석조리식품, 소스, 육수, 절임식품, 수산물가공품", v: "30~100g, 100~200g, 300~400g, 400g~1kg, 2kg~5kg" },
  { k: "냉동 숙면류", v: "130g~150g" },
  { k: "멀티박 진공포장", v: "100g~200g" },
  { k: "진공포장", v: "100g~5kg" },
];

export default function ManufacturingPage() {
  return (
    <>
      <PageHeader title="식품 제조" section="회사소개" current="/company/manufacturing" />

      {/* 제조 프로세스 */}
      <section className="mx-auto max-w-[1180px] px-5 pb-14 pt-16">
        <h2 className="bg-dark px-5 py-2.5 text-[16px] font-extrabold text-white">
          식품 제조 프로세스
        </h2>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROCESS.map((p, i) => (
            <li key={p} className="flex items-center gap-4 border border-line px-5 py-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-brand text-[14px] font-extrabold text-brand tabular-nums">
                {i + 1}
              </span>
              <span className="text-[14px] font-bold">{p}</span>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-[13px] text-muted">
          전 제품이 금속검출기와 중량선별기를 전수 통과하며, 영하 38도 이하
          급속 냉동 후 영하 18도 이하로 냉동 보관합니다.
        </p>
      </section>

      {/* 제조 품목 */}
      <section className="mx-auto max-w-[1180px] px-5 pb-14">
        <h2 className="bg-dark px-5 py-2.5 text-[16px] font-extrabold text-white">
          식품제조품목 <span className="ml-1 text-[13px] font-bold">(B2B/B2C, OEM/ODM)</span>
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((it) => (
            <li key={it.t + it.s} className="bg-surface-2 px-6 py-6 text-center">
              <h3 className="text-[17px] font-extrabold text-brand">
                {it.t}
                {it.s && <span className="mt-0.5 block text-[15px]">{it.s}</span>}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{it.d}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 포장 형태 */}
      <section className="mx-auto max-w-[1180px] px-5 pb-20">
        <h2 className="bg-dark px-5 py-2.5 text-[16px] font-extrabold text-white">포장 형태</h2>

        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <div className="space-y-7">
            <article>
              <h3 className="border-b border-line pb-2 text-[16px] font-bold">
                RTH (Ready to Heat) / 원팩
              </h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
                한 개의 파우치 안에 육수/소스와 고형물(야채, 고기 등)이 모두
                담겨 있는 형태
                <br />
                <span className="text-faint">※ 간단하게 데워서 빠르게 섭취하는 형태</span>
              </p>
            </article>
            <article>
              <h3 className="border-b border-line pb-2 text-[16px] font-bold">
                RTC (Ready to Cook) / 밀키트
              </h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
                각각의 구성품을 하나의 패키지에 담아 포장하는 형태
                <br />
                <span className="text-faint">※ 간단한 조리가 필요한 형태</span>
              </p>
            </article>
            <article>
              <h3 className="border-b border-line pb-2 text-[16px] font-bold">기타 포장 형태</h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
                캡파우치 포장 · 삼방 파우치 포장 · 트레이 포장
              </p>
            </article>
          </div>

          <div>
            <h3 className="border-b border-line pb-2 text-[16px] font-bold">포장 가능 규격</h3>
            <table className="mt-4 w-full border-collapse text-left text-[13.5px]">
              <caption className="sr-only">포장 가능 규격표</caption>
              <tbody>
                {PACKAGING.map((p) => (
                  <tr key={p.k} className="border-b border-line">
                    <th scope="row" className="w-[52%] bg-surface-2 px-4 py-3.5 align-top font-bold">
                      {p.k}
                    </th>
                    <td className="px-4 py-3.5 text-muted tabular-nums">{p.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 원본 안내 이미지 */}
        <div className="mt-12 space-y-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/company/process.jpg" alt="식품 제조 프로세스 도식" className="content-img" loading="lazy" width={1200} height={660} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/company/items.jpg" alt="식품제조품목 표 (B2B/B2C, OEM/ODM)" className="content-img" loading="lazy" width={1400} height={700} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/company/packaging.jpg" alt="포장 형태와 포장 가능 규격 안내" className="content-img" loading="lazy" width={960} height={740} />
        </div>
      </section>
    </>
  );
}
