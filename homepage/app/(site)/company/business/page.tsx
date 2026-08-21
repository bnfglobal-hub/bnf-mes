import type { Metadata } from "next";
import PageHeader from "@/app/components/PageHeader";
import { content, styleOf } from "@/lib/content";

export const metadata: Metadata = {
  title: "사업분야",
  description: "무역(수입·수출), 유통, 물류, 제조 — ㈜비엔에프글로벌의 4대 사업분야.",
};

export default function BusinessPage() {
  const b = content.business;

  return (
    <>
      <PageHeader title="사업분야" section="회사소개" current="/company/business" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid gap-12 md:grid-cols-[380px_1fr] md:items-start">
          {b.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={b.image}
              data-img="business.image"
              style={styleOf("business.image")}
              alt="B&F GLOBAL 사업 구조 — 제조, 무역, 유통, 물류"
              className="content-img"
              loading="lazy"
              width={960}
              height={790}
            />
          )}

          <div className="space-y-9">
            {b.areas.map((a, ai) => (
              <article key={a.title}>
                <h2 className="border-b-2 border-ink pb-2 text-[19px] font-extrabold">
                  <span data-edit={`business.areas.${ai}.title`}>{a.title}</span>
                  {a.sub && <span data-edit={`business.areas.${ai}.sub`} className="ml-2.5 text-[13px] font-bold text-muted">{a.sub}</span>}
                </h2>
                <dl className="mt-4 space-y-4">
                  {a.rows.map((r, ri) => (
                    <div key={r.key}>
                      <dt data-edit={`business.areas.${ai}.rows.${ri}.key`} className="text-[15px] font-bold">{r.key}</dt>
                      <dd data-edit={`business.areas.${ai}.rows.${ri}.value`} className="mt-1 text-[13.5px] leading-relaxed text-muted">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
