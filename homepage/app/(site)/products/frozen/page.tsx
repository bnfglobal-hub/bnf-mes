import type { Metadata } from "next";
import PageHeader from "@/app/components/PageHeader";
import { content } from "@/lib/content";

export const metadata: Metadata = {
  title: "냉동 수산 / 축산물",
  description: "냉동 수산물, 축산물, 냉동 식품, 기타 공산품 취급 품목.",
};

export default function FrozenPage() {
  const p = content.frozen;

  return (
    <>
      <PageHeader title="냉동 수산 / 축산물" section="제품소개" current="/products/frozen" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <ul className="grid gap-5 sm:grid-cols-2">
          {p.categories.map((c) => (
            <li key={c.title} className="border border-line p-7">
              <div className="flex items-baseline gap-3">
                <h2 className="text-[19px] font-extrabold">{c.title}</h2>
                {c.count && <span className="text-[13px] font-bold text-brand tabular-nums">{c.count}</span>}
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{c.desc}</p>
              {c.form && (
                <p className="mt-3 inline-block bg-surface-2 px-3 py-1.5 text-[12.5px] font-bold text-muted">
                  {c.form}
                </p>
              )}
            </li>
          ))}
        </ul>

        {p.heroImage && (
          <div className="mt-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.heroImage} alt="냉동 수산물·축산물 제품" className="content-img" loading="lazy" width={2500} height={1400} />
          </div>
        )}
      </section>
    </>
  );
}
