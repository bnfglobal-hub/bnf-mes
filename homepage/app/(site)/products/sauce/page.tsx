import type { Metadata } from "next";
import PageHeader from "@/app/components/PageHeader";
import { content } from "@/lib/content";

export const metadata: Metadata = {
  title: "소스 / 육수",
  description: "육수 베이스와 각종 소스류 OEM 제조.",
};

export default function SaucePage() {
  const p = content.sauce;

  return (
    <>
      <PageHeader title="소스 / 육수" section="제품소개" current="/products/sauce" lead={p.lead} />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid gap-12 md:grid-cols-[1fr_360px] md:items-start">
          <div className="grid gap-10 sm:grid-cols-2">
            {p.groups.map((g) => (
              <div key={g.title}>
                <h2 className="border-b-2 border-ink pb-2 text-[18px] font-extrabold">{g.title}</h2>
                <ul className="mt-4">
                  {g.items.map((it) => (
                    <li key={it} className="flex gap-3 border-b border-line py-3 text-[14px]">
                      <span aria-hidden="true" className="text-brand">·</span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {p.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image} alt="소스·육수 제품" className="content-img" loading="lazy" width={1500} height={1000} />
          )}
        </div>
      </section>
    </>
  );
}
