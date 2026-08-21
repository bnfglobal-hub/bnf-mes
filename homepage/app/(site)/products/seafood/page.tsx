import type { Metadata } from "next";
import PageHeader from "@/app/components/PageHeader";
import { content } from "@/lib/content";

export const metadata: Metadata = {
  title: "수산물가공품 / 절임식품",
  description: "간장게장, 양념게장, 전복장, 새우장, 쭈꾸미 볶음 등.",
};

export default function SeafoodPage() {
  const p = content.seafood;

  return (
    <>
      <PageHeader title={p.title} section="제품소개" current="/products/seafood" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3">
          {p.items.map((it, i) => (
            <li key={it.name + i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.image}
                data-img={`seafood.items.${i}.image`}
                alt={it.name}
                className="aspect-[4/3] w-full bg-surface-2 object-cover"
                loading="lazy"
                width={500}
                height={375}
              />
              <p data-edit={`seafood.items.${i}.name`} className="mt-3 text-[14px] font-bold">{it.name}</p>
            </li>
          ))}
        </ul>

        {p.heroImage && (
          <div className="mt-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.heroImage} alt="수산물가공품 및 절임식품" className="content-img" loading="lazy" width={2500} height={1400} />
          </div>
        )}
      </section>
    </>
  );
}
