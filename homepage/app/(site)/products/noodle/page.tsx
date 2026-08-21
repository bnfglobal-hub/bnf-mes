import type { Metadata } from "next";
import PageHeader from "@/app/components/PageHeader";
import { content, paragraphs } from "@/lib/content";

export const metadata: Metadata = {
  title: "면류",
  description: "국내 최초 발효공법 생면 쌀국수 — 글루텐프리·저염, -40℃ 급속 동결.",
};

export default function NoodlePage() {
  const p = content.noodle;
  const img = (i: number) => p.images[i];

  return (
    <>
      <PageHeader title="면류" section="제품소개" current="/products/noodle" lead={p.lead} />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid gap-10 md:grid-cols-[1fr_420px] md:items-center">
          <div className="space-y-5 text-[14.5px] leading-[1.9]">
            {paragraphs(p.intro).map((t) => (
              <p key={t}>{t}</p>
            ))}
            {p.quote && (
              <blockquote className="border-l-2 border-brand pl-5 text-[15px] font-bold leading-[1.8]">
                {p.quote}
              </blockquote>
            )}
          </div>
          {img(0) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img(0)} alt="발효 생면 쌀국수" className="content-img" loading="lazy" width={1500} height={1000} />
          )}
        </div>

        <div className="mt-20">
          <h2 className="text-[19px] font-extrabold">{p.riceTitle}</h2>
          <div className="mt-5 grid gap-10 md:grid-cols-[1fr_420px] md:items-start">
            <div className="space-y-4 text-[14px] leading-[1.9] text-muted">
              {paragraphs(p.riceBody).map((t) => (
                <p key={t}>{t}</p>
              ))}
              <p className="text-[13px] text-faint">※ 100g 기준</p>
              <table className="w-full border-collapse text-left text-[13.5px]">
                <caption className="sr-only">100g 기준 열량 비교</caption>
                <tbody>
                  {p.kcal.map((r) => (
                    <tr key={r.key} className="border-b border-line">
                      <th scope="row" className="py-3 font-bold text-ink">{r.key}</th>
                      <td className={`py-3 text-right tabular-nums ${r.highlight ? "font-extrabold text-brand" : "text-muted"}`}>
                        {r.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {img(1) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img(1)} alt="안남미 원료" className="content-img" loading="lazy" width={1500} height={1000} />
            )}
          </div>
        </div>

        <div className="mt-20 grid gap-10 md:grid-cols-2">
          <article>
            <h2 className="text-[19px] font-extrabold">{p.ingredientTitle}</h2>
            <p className="mt-4 text-[14px] leading-[1.9] text-muted">{p.ingredientBody}</p>
          </article>
          <article>
            <h2 className="text-[19px] font-extrabold">{p.freezeTitle}</h2>
            <p className="mt-4 text-[14px] leading-[1.9] text-muted">{p.freezeBody}</p>
          </article>
        </div>

        {(img(2) || img(3)) && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {[img(2), img(3)].filter(Boolean).map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="발효 생면 제조" className="content-img" loading="lazy" width={1500} height={1000} />
            ))}
          </div>
        )}

        <div className="mt-20">
          <h2 className="text-[19px] font-extrabold">{p.strengthTitle}</h2>
          <ol className="mt-6 max-w-3xl">
            {p.strengths.map((s, i) => (
              <li key={s} className="flex gap-5 border-b border-line py-5">
                <span className="shrink-0 text-[15px] font-extrabold text-brand tabular-nums">{i + 1}</span>
                <p className="text-[14px] leading-relaxed">{s}</p>
              </li>
            ))}
          </ol>
        </div>

        {(img(4) || img(5)) && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {[img(4), img(5)].filter(Boolean).map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="쌀국수 활용" className="content-img" loading="lazy" width={1500} height={1000} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
