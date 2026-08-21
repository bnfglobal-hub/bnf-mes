import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import { content } from "@/lib/content";

export const metadata: Metadata = {
  title: "HMR(수출용)",
  description: "수출용 HMR(가정간편식) 가공식품.",
};

export default function HmrExportPage() {
  const p = content.hmrExport;

  return (
    <>
      <PageHeader title="간편식 / HMR" section="제품소개" current="/products/hmr-export" lead={p.lead} />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        {p.heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.heroImage} alt="수출용 HMR 제품 라인업" className="content-img" loading="lazy" width={2500} height={1400} />
        )}

        <div className="mt-12 border-t border-line pt-10 text-center">
          <p className="text-[15px] font-bold">{p.ctaTitle}</p>
          <p className="mt-2 text-[13.5px] text-muted">{p.ctaDesc}</p>
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
