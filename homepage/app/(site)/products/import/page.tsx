import type { Metadata } from "next";
import PageHeader from "@/app/components/PageHeader";
import { content } from "@/lib/content";

export const metadata: Metadata = {
  title: "수입 제품",
  description: "볶음 참깨, 들깨 가루 등 직수입 원료.",
};

export default function ImportPage() {
  const p = content.import;

  return (
    <>
      <PageHeader title="수입 제품" section="제품소개" current="/products/import" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <h2 className="text-[19px] font-bold">{p.title}</h2>
        {p.origin && <p className="mt-2 text-[13.5px] text-muted">{p.origin}</p>}

        {p.images.length > 0 && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {p.images.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt={p.title} className="content-img" loading="lazy" width={1500} height={1000} />
            ))}
          </div>
        )}

        {p.heroImage && (
          <div className="mt-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.heroImage} alt="수입 제품 안내" className="content-img" loading="lazy" width={2500} height={1400} />
          </div>
        )}
      </section>
    </>
  );
}
