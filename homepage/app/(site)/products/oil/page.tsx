import type { Metadata } from "next";
import PageHeader from "@/app/components/PageHeader";
import { content } from "@/lib/content";

export const metadata: Metadata = {
  title: "식용 유지",
  description: "참기름, 들기름, 향미유 등 식용유지 제품.",
};

export default function OilPage() {
  const p = content.oil;

  return (
    <>
      <PageHeader title={p.title} section="제품소개" current="/products/oil" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid gap-12 md:grid-cols-[1fr_380px] md:items-start">
          <div className="space-y-10">
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

          <div className="space-y-6">
            {p.images.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt={p.title} className="content-img" loading="lazy" width={1500} height={1000} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
