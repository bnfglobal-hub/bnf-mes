import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "../../components/PageHeader";
import { COMPANY_INFO as C } from "../../components/nav";

export const metadata: Metadata = {
  title: "문의하기",
  description: "㈜비엔에프글로벌 문의 안내 — 대표번호, 팩스, 본사·제조공장 연락처.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="문의하기"
        section="고객센터"
        current="/support/contact"
        lead="제휴·입점·납품·구매 문의를 받습니다."
      />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:max-w-3xl">
          <a href={`tel:${C.tel}`} className="group border border-line p-7 transition-colors hover:border-brand">
            <h2 className="text-[13px] font-bold tracking-wide text-faint group-hover:text-brand">
              대표번호
            </h2>
            <p className="mt-2 text-[26px] font-extrabold tabular-nums">{C.tel}</p>
            <p className="mt-1 text-[12.5px] text-muted">평일 09:00 – 18:00</p>
          </a>

          <div className="border border-line p-7">
            <h2 className="text-[13px] font-bold tracking-wide text-faint">팩스</h2>
            <p className="mt-2 text-[26px] font-extrabold tabular-nums">{C.hq.fax}</p>
            <p className="mt-1 text-[12.5px] text-muted">문서 · 제안서 수신</p>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:max-w-3xl">
          {[
            { name: "본사", ...C.hq },
            { name: "제조공장", ...C.factory },
          ].map((loc) => (
            <article key={loc.addr} className="border border-line p-7">
              <h2 className="text-[15px] font-extrabold">{loc.name}</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed">{loc.addr}</p>
              <p className="mt-1.5 text-[12.5px] text-muted tabular-nums">
                T. {loc.tel} · F. {loc.fax}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 bg-surface-2 p-8 lg:max-w-3xl">
          <h2 className="text-[16px] font-extrabold">OEM·ODM 제조 문의는 별도 양식으로</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
            제조 견적은 품목·수량·포장 형태 등 확인할 항목이 많습니다.
            견적 신청 양식을 이용하시면 더 빠르게 안내받으실 수 있습니다.
          </p>
          <Link
            href="/support/oem"
            className="mt-5 inline-block bg-brand px-6 py-3.5 text-[13.5px] font-bold text-white transition-colors hover:bg-brand-deep"
          >
            OEM 견적 신청하기
          </Link>
        </div>

        <p className="mt-10 text-[13px] leading-relaxed text-muted lg:max-w-3xl">
          ※ 원본 사이트에서 운영하던 문의 게시판은 회원·게시글 데이터가 필요해
          이번 재구축에는 포함하지 않았습니다. 게시판이 필요하시면 별도로
          붙일 수 있습니다.
        </p>
      </section>
    </>
  );
}
