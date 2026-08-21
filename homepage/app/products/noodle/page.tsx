import type { Metadata } from "next";
import PageHeader from "../../components/PageHeader";

export const metadata: Metadata = {
  title: "면류",
  description:
    "국내 최초 발효공법 생면 쌀국수 — 글루텐프리·저염, 안남미 자연발효, -40℃ 급속 동결, HACCP 인증 제조.",
};

const STRENGTHS = [
  "제면기를 두지 않아 인건비, 보수관리비용, 공간확보의 불편함을 해소할 수 있습니다.",
  "발효 생면은 쉽게 불지 않습니다. 육수를 지속적으로 흡수하는 건면과는 다른 숙면이기 때문에 장시간 방치에도 면이 육수를 흡수하지 않습니다.",
  "간편하고 빠른 조리법으로 전문매장과 동일한 퀄리티를 가질 수 있습니다. (끓는 물에 조리 시 냉동 상태 1분, 해동 상태 4초)",
  "미리 해면을 해두어도 서로 쉽게 떡지거나 달라붙지 않습니다. 물기를 뺀 상태에 끓는 육수를 부어주기만 하면 식감이 바로 되살아납니다.",
  "부드러운 식감이 월등하여 쌀국수 이외에 다양한 메뉴와도 접목이 용이합니다.",
];

const KCAL = [
  { k: "자포니카종 (단립종)", v: "242 kcal" },
  { k: "인디카종 (안남미)", v: "130 kcal" },
  { k: "발효 생면 쌀국수", v: "105 kcal", hl: true },
];

export default function NoodlePage() {
  return (
    <>
      <PageHeader
        title="면류"
        section="제품소개"
        current="/products/noodle"
        lead="순수 안남미를 발효한 생면 쌀국수 [글루텐프리 / 저염]"
      />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        {/* 도입 */}
        <div className="grid gap-10 md:grid-cols-[1fr_420px] md:items-center">
          <div className="space-y-5 text-[14.5px] leading-[1.9]">
            <p>
              국내 최초 발효공법으로 생산하여 제조기간이 15일 이상 소요되는
              최고급 쌀국수입니다. 글루텐, 타피오카, 전분, 각종 합성 첨가물이
              들어가지 않고 높은 쌀 함유량을 자랑합니다.
            </p>
            <p>
              깔끔하고 부드러운 식감을 자랑하며 남녀노소 누구나 건강하게 즐길 수
              있는 먹거리입니다. HACCP 인증 제조 시설에서 안전하게 생산됩니다.
            </p>
            <blockquote className="border-l-2 border-brand pl-5 text-[15px] font-bold leading-[1.8]">
              베트남에서 직접 기술을 전수받아 베트남 제면기를 수입해 하노이
              전통 제면방식 그대로 재현한 대한민국 유일의 숙면 쌀국수입니다.
            </blockquote>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/products/noodle1.jpg" alt="발효 생면 쌀국수" className="content-img" loading="lazy" width={1500} height={1000} />
        </div>

        {/* 원료 설명 */}
        <div className="mt-20">
          <h2 className="text-[19px] font-extrabold">원료로 사용되는 안남미란?</h2>
          <div className="mt-5 grid gap-10 md:grid-cols-[1fr_420px] md:items-start">
            <div className="space-y-4 text-[14px] leading-[1.9] text-muted">
              <p>
                인디카종(장립종, 안남미)과 자포니카종(단립종, 중립종)의 가장 큰
                차이는 전분의 결합구조 차이입니다. 전분(녹말)은 아밀로오스와
                아밀로펙틴의 혼합물로, 두 품종은 각 함량에 차이가 있습니다.
              </p>
              <p>
                자포니카종은 전분 중 아밀로오스 함량이 약 15~20%, 인디카종은 이
                보다 많은 약 25~30%입니다. 아밀로오스 함량이 낮을수록, 즉
                아밀로펙틴 함량이 높을수록 끈기가 강하고 포만감이 오래
                유지됩니다. 반면 인디카종은 아밀로펙틴 함량이 낮기 때문에
                소화가 더 빨리 되어 다이어트에 탁월합니다.
              </p>
              <p className="text-[13px] text-faint">※ 100g 기준</p>
              <table className="w-full border-collapse text-left text-[13.5px]">
                <caption className="sr-only">100g 기준 열량 비교</caption>
                <tbody>
                  {KCAL.map((r) => (
                    <tr key={r.k} className="border-b border-line">
                      <th scope="row" className="py-3 font-bold text-ink">{r.k}</th>
                      <td className={`py-3 text-right tabular-nums ${r.hl ? "font-extrabold text-brand" : "text-muted"}`}>
                        {r.v}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/products/noodle2.jpg" alt="안남미 원료" className="content-img" loading="lazy" width={1500} height={1000} />
          </div>
        </div>

        {/* 원료·동결 */}
        <div className="mt-20 grid gap-10 md:grid-cols-2">
          <article>
            <h2 className="text-[19px] font-extrabold">건강한 원료만 담았습니다</h2>
            <p className="mt-4 text-[14px] leading-[1.9] text-muted">
              수입 건면, 국내산 기계로 만든 압출식 면과는 차원이 다른 월등히
              부드러운 식감을 가지고 있습니다. 자사 생면은 이미 익어서 제조되는
              숙면입니다. 높은 쌀 함유량으로 밀가루, 전분, 타피오카, 구아검,
              합성보존료, 합성착색료를 전혀 넣지 않은 글루텐프리의 안전한
              먹거리입니다.
            </p>
          </article>
          <article>
            <h2 className="text-[19px] font-extrabold">-40℃ 급속 동결</h2>
            <p className="mt-4 text-[14px] leading-[1.9] text-muted">
              제조와 동시에 -40℃에서 급속동결 과정을 거쳐 냉동 시 면이 불어나는
              현상과 노화가 진행되는 현상을 방지하였습니다.
            </p>
          </article>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/products/noodle3.jpg" alt="발효 생면 제조 공정" className="content-img" loading="lazy" width={1500} height={1000} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/products/noodle4.jpg" alt="급속 동결된 숙면" className="content-img" loading="lazy" width={1500} height={1000} />
        </div>

        {/* 강점 */}
        <div className="mt-20">
          <h2 className="text-[19px] font-extrabold">발효 생면 쌀국수의 강점</h2>
          <ol className="mt-6 max-w-3xl">
            {STRENGTHS.map((s, i) => (
              <li key={s} className="flex gap-5 border-b border-line py-5">
                <span className="shrink-0 text-[15px] font-extrabold text-brand tabular-nums">
                  {i + 1}
                </span>
                <p className="text-[14px] leading-relaxed">{s}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/products/noodle5.jpg" alt="쌀국수 완성 조리" className="content-img" loading="lazy" width={1500} height={1000} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/products/noodle6.jpg" alt="쌀국수 활용 메뉴" className="content-img" loading="lazy" width={1500} height={1000} />
        </div>
      </section>
    </>
  );
}
