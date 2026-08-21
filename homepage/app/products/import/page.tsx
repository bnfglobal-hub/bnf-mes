import type { Metadata } from "next";
import PageHeader from "../../components/PageHeader";

export const metadata: Metadata = {
  title: "수입 제품",
  description: "볶음 참깨, 들깨 가루 등 직수입 원료 (원산지: 베트남, 미얀마).",
};

export default function ImportPage() {
  return (
    <>
      <PageHeader title="수입 제품" section="제품소개" current="/products/import" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <h2 className="text-[19px] font-bold">볶음 참깨, 들깨 가루</h2>
        <p className="mt-2 text-[13.5px] text-muted">원산지 : 베트남, 미얀마</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/products/sesame-1.jpg" alt="볶음 참깨" className="content-img" loading="lazy" width={1500} height={1000} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/products/sesame-2.jpg" alt="들깨 가루" className="content-img" loading="lazy" width={1500} height={1000} />
        </div>

        <div className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/products/sesame-hero.png" alt="수입 참깨·들깨 제품 안내" className="content-img" loading="lazy" width={2500} height={1400} />
        </div>
      </section>
    </>
  );
}
