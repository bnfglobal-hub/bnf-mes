import type { Metadata } from "next";
import PageHeader from "../../components/PageHeader";

export const metadata: Metadata = {
  title: "인사말",
  description: "㈜비엔에프글로벌은 새로운 식품문화를 선도합니다 — 대표이사 인사말.",
};

export default function GreetingPage() {
  return (
    <>
      <PageHeader title="인사말" section="회사소개" current="/company/greeting" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <h2 className="text-[clamp(1.15rem,2.4vw,1.6rem)] font-bold leading-snug">
          ㈜비엔에프글로벌은 새로운 식품문화를 선도 합니다.
        </h2>

        <div className="mt-10 grid gap-12 md:grid-cols-[1.25fr_1fr] md:items-start">
          <div className="space-y-6 text-[15px] leading-[1.9]">
            <p>
              ㈜비엔에프글로벌은 1990년 종합식품회사로 출발하여{" "}
              <strong className="font-bold">
                &ldquo;고객의 식탁에 오르는 모든 식재료는 건강하고 신뢰할 수
                있어야 한다&rdquo;
              </strong>
              는 철학을 바탕으로 성장해왔습니다.
            </p>
            <p>
              당사는 식품 수입, 수출, 제조, 유통, 물류 사업을 영위하며 철저한
              품질 관리와 체계적인 시스템을 통해 안전하고 신뢰할 수 있는 식품을
              공급하고 있습니다.
            </p>
            <p>
              ㈜비엔에프글로벌은 변화하는 식문화 속에서도 소비자와 고객사의
              신뢰를 바탕으로 건강하고 즐거운 식문화를 선도하는 기업이
              되겠습니다.
            </p>
            <p>감사합니다.</p>
            <p className="pt-4 text-[14px] text-muted">
              ㈜비엔에프글로벌 대표이사{" "}
              <strong className="ml-1 text-[16px] text-ink">이 용 재</strong>
            </p>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/company/greeting.jpg"
            alt="양파, 마늘, 고추 등 신선한 식재료"
            className="content-img"
            loading="lazy"
            width={1215}
            height={805}
          />
        </div>
      </section>
    </>
  );
}
