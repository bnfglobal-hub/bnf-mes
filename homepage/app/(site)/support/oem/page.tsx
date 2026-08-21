import type { Metadata } from "next";
import PageHeader from "@/app/components/PageHeader";
import OemForm from "./OemForm";
import { content, company } from "@/lib/content";

export const metadata: Metadata = {
  title: "OEM 견적",
  description: "OEM/ODM 제조 견적 신청.",
};

export default function OemPage() {
  const o = content.oem;

  return (
    <>
      <PageHeader title={o.title} section="고객센터" current="/support/oem" lead={o.lead} />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid gap-14 lg:grid-cols-[1fr_300px] lg:items-start">
          <OemForm types={o.types} messageHelp={o.messageHelp} privacyText={o.privacyText} tel={company.tel} fax={company.hq.fax} />

          <aside className="space-y-8 border-l border-line lg:pl-8">
            <div>
              <h2 className="text-[13px] font-bold tracking-wide text-faint">전화 문의</h2>
              <a href={`tel:${company.tel}`} className="mt-1.5 block text-[24px] font-extrabold tabular-nums transition-colors hover:text-brand">
                {company.tel}
              </a>
              <p className="mt-1 text-[12.5px] text-muted">{o.officeHours}</p>
            </div>

            <div>
              <h2 className="text-[13px] font-bold tracking-wide text-faint">팩스</h2>
              <p className="mt-1.5 text-[16px] font-bold tabular-nums">{company.hq.fax}</p>
              <p className="mt-1 text-[12.5px] text-muted">견적 요청서 · 제품 사양서 수신</p>
            </div>

            <div>
              <h2 className="text-[13px] font-bold tracking-wide text-faint">제조공장</h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed">{company.factory.addr}</p>
              <p className="mt-1 text-[12.5px] text-muted tabular-nums">T. {company.factory.tel}</p>
            </div>

            <div className="bg-surface-2 p-5">
              <h2 className="text-[13.5px] font-bold">진행 절차</h2>
              <ol className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-muted">
                {o.steps.map((s, i) => (
                  <li key={s} className="flex gap-2.5">
                    <span className="font-bold text-brand tabular-nums">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
