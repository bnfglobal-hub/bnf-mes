import type { Metadata } from "next";
import PageHeader from "@/app/components/PageHeader";
import { content } from "@/lib/content";

export const metadata: Metadata = {
  title: "식품제조",
  description: "식품 제조 프로세스, 제조 품목(B2B/B2C, OEM/ODM), 포장 형태와 가능 규격.",
};

export default function ManufacturingPage() {
  const m = content.manufacturing;

  return (
    <>
      <PageHeader title="식품 제조" section="회사소개" current="/company/manufacturing" />

      <section className="mx-auto max-w-[1180px] px-5 pb-14 pt-16">
        <h2 className="bg-dark px-5 py-2.5 text-[16px] font-extrabold text-white">
          식품 제조 프로세스
        </h2>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {m.process.map((p, i) => (
            <li key={p} className="flex items-center gap-4 border border-line px-5 py-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-brand text-[14px] font-extrabold text-brand tabular-nums">
                {i + 1}
              </span>
              <span className="text-[14px] font-bold">{p}</span>
            </li>
          ))}
        </ol>
        {m.processNote && <p className="mt-5 text-[13px] text-muted">{m.processNote}</p>}
      </section>

      <section className="mx-auto max-w-[1180px] px-5 pb-14">
        <h2 className="bg-dark px-5 py-2.5 text-[16px] font-extrabold text-white">
          식품제조품목 <span className="ml-1 text-[13px] font-bold">(B2B/B2C, OEM/ODM)</span>
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {m.items.map((it, i) => (
            <li key={it.title + it.sub + i} className="bg-surface-2 px-6 py-6 text-center">
              <h3 className="text-[17px] font-extrabold text-brand">
                {it.title}
                {it.sub && <span className="mt-0.5 block text-[15px]">{it.sub}</span>}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{it.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 pb-20">
        <h2 className="bg-dark px-5 py-2.5 text-[16px] font-extrabold text-white">포장 형태</h2>

        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <div className="space-y-7">
            {m.packagingTypes.map((t) => (
              <article key={t.title}>
                <h3 className="border-b border-line pb-2 text-[16px] font-bold">{t.title}</h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
                  {t.desc}
                  {t.note && (
                    <>
                      <br />
                      <span className="text-faint">{t.note}</span>
                    </>
                  )}
                </p>
              </article>
            ))}
          </div>

          <div>
            <h3 className="border-b border-line pb-2 text-[16px] font-bold">포장 가능 규격</h3>
            <table className="mt-4 w-full border-collapse text-left text-[13.5px]">
              <caption className="sr-only">포장 가능 규격표</caption>
              <tbody>
                {m.packagingSpecs.map((p) => (
                  <tr key={p.key} className="border-b border-line">
                    <th scope="row" className="w-[52%] bg-surface-2 px-4 py-3.5 align-top font-bold">
                      {p.key}
                    </th>
                    <td className="px-4 py-3.5 text-muted tabular-nums">{p.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {m.images.length > 0 && (
          <div className="mt-12 space-y-8">
            {m.images.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="식품 제조 안내" className="content-img" loading="lazy" width={1200} height={660} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
