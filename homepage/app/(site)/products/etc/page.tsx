import type { Metadata } from "next";
import PageHeader from "@/app/components/PageHeader";
import { content } from "@/lib/content";

export const metadata: Metadata = {
  title: "기타 가공품",
  description: "마늘후레이크, 프리믹스, 분말믹스 등.",
};

export default function EtcPage() {
  const p = content.etc;

  return (
    <>
      <PageHeader title="기타 가공품" section="제품소개" current="/products/etc" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <ul className="grid gap-6 sm:grid-cols-3">
          {p.items.map((it, i) => (
            <li key={it.name + i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.image}
                alt={it.name}
                className="aspect-[4/3] w-full bg-surface-2 object-cover"
                loading="lazy"
                width={500}
                height={375}
              />
              <p className="mt-3 text-[14.5px] font-bold">{it.name}</p>
              {it.spec && <p className="mt-0.5 text-[13px] text-muted tabular-nums">{it.spec}</p>}
            </li>
          ))}
        </ul>

        {p.note && <p className="mt-10 text-[13.5px] text-muted">{p.note}</p>}
      </section>
    </>
  );
}
