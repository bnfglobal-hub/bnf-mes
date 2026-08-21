import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "../../components/PageHeader";

export const metadata: Metadata = {
  title: "HMR(수출용)",
  description: "수출용 HMR(가정간편식) 가공식품 — 국·탕류, 냉동 밀키트, 소스·육수.",
};

export default function HmrExportPage() {
  return (
    <>
      <PageHeader
        title="간편식 / HMR"
        section="제품소개"
        current="/products/hmr-export"
        lead="수출용 HMR(가정간편식) 가공식품입니다."
      />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/products/hmr-hero.png"
          alt="수출용 HMR 가정간편식 제품 라인업"
          className="content-img"
          loading="lazy"
          width={2500}
          height={1400}
        />

        <div className="mt-12 border-t border-line pt-10 text-center">
          <p className="text-[15px] font-bold">수출 상담을 원하시나요?</p>
          <p className="mt-2 text-[13.5px] text-muted">
            품목과 수량, 목적 국가를 알려주시면 담당자가 안내해 드립니다.
          </p>
          <Link
            href="/support/oem"
            className="mt-6 inline-block bg-brand px-7 py-3.5 text-[13.5px] font-bold text-white transition-colors hover:bg-brand-deep"
          >
            문의하기
          </Link>
        </div>
      </section>
    </>
  );
}
