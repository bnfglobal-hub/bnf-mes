import type { Metadata } from "next";
import PageHeader from "../../components/PageHeader";
import OemForm from "./OemForm";
import { COMPANY_INFO as C } from "../../components/nav";

export const metadata: Metadata = {
  title: "OEM 견적",
  description: "OEM/ODM 제조 견적 신청 — 품목, 유형, 제조공정, 포장방법을 알려주시면 안내해 드립니다.",
};

export default function OemPage() {
  return (
    <>
      <PageHeader
        title="OEM제조 견적 신청"
        section="고객센터"
        current="/support/oem"
        lead="제품 기획 단계라도 좋습니다. 품목·수량·포장 형태를 알려주시면 상담부터 양산까지 안내해 드립니다."
      />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid gap-14 lg:grid-cols-[1fr_300px] lg:items-start">
          <OemForm />

          <aside className="space-y-8 border-l border-line lg:pl-8">
            <div>
              <h2 className="text-[13px] font-bold tracking-wide text-faint">전화 문의</h2>
              <a
                href={`tel:${C.tel}`}
                className="mt-1.5 block text-[24px] font-extrabold tabular-nums transition-colors hover:text-brand"
              >
                {C.tel}
              </a>
              <p className="mt-1 text-[12.5px] text-muted">평일 09:00 – 18:00</p>
            </div>

            <div>
              <h2 className="text-[13px] font-bold tracking-wide text-faint">팩스</h2>
              <p className="mt-1.5 text-[16px] font-bold tabular-nums">{C.hq.fax}</p>
              <p className="mt-1 text-[12.5px] text-muted">견적 요청서 · 제품 사양서 수신</p>
            </div>

            <div>
              <h2 className="text-[13px] font-bold tracking-wide text-faint">제조공장</h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed">{C.factory.addr}</p>
              <p className="mt-1 text-[12.5px] text-muted tabular-nums">T. {C.factory.tel}</p>
            </div>

            <div className="bg-surface-2 p-5">
              <h2 className="text-[13.5px] font-bold">진행 절차</h2>
              <ol className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-muted">
                {["상담", "레시피·배합 개발", "시제품", "HACCP 양산", "납품·물류"].map((s, i) => (
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
