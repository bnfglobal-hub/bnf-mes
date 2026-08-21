import type { Metadata } from "next";
import PageHeader from "../../components/PageHeader";

export const metadata: Metadata = {
  title: "인증현황",
  description: "품목군별 HACCP 인증 6건, 기업부설연구소, 벤처기업·이노비즈 확인, 특허 2건.",
};

const CERTS = [
  { t: "기타수산물가공품 HACCP 인증서", g: "HACCP" },
  { t: "면류(숙면) HACCP 인증서", g: "HACCP" },
  { t: "소스 HACCP 인증서", g: "HACCP" },
  { t: "식육추출(양념육, 식육추출가공품) HACCP 인증서", g: "HACCP" },
  { t: "절임식품 HACCP 인증서", g: "HACCP" },
  { t: "즉석조리식품 HACCP 인증서", g: "HACCP" },
  { t: "기업부설연구소 인정서", g: "연구·기술" },
  { t: "벤처기업 확인서", g: "연구·기술" },
  { t: "이노비즈(기술혁신형 중소기업) 확인서", g: "연구·기술" },
  { t: "특허증 1", g: "특허" },
  { t: "특허증 2", g: "특허" },
];

export default function CertificationPage() {
  return (
    <>
      <PageHeader
        title="인증 현황"
        section="회사소개"
        current="/company/certification"
        lead="품목군마다 개별 HACCP 인증을 취득했으며, 기업부설연구소와 특허를 보유하고 있습니다."
      />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CERTS.map((c) => (
            <li key={c.t} className="flex items-start gap-3 border border-line px-5 py-4">
              <span className="mt-0.5 shrink-0 bg-brand-soft px-2 py-1 text-[11px] font-bold text-brand">
                {c.g}
              </span>
              <span className="text-[13.5px] font-bold leading-snug">{c.t}</span>
            </li>
          ))}
        </ul>

        <div className="mt-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/company/certs.jpg"
            alt="HACCP 인증서 6종, 기업부설연구소 인정서, 벤처기업확인서, 이노비즈 확인서, 특허증 2건 원본"
            className="content-img border border-line"
            loading="lazy"
            width={727}
            height={891}
          />
        </div>
      </section>
    </>
  );
}
