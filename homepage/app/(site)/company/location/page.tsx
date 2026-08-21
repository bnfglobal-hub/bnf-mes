import type { Metadata } from "next";
import PageHeader from "@/app/components/PageHeader";
import LocationMap from "@/app/components/LocationMap";
import { company } from "@/lib/content";

export const metadata: Metadata = {
  title: "오시는 길",
  description: "㈜비엔에프글로벌 본사와 제조공장 위치 안내.",
};

export default function LocationPage() {
  return (
    <>
      <PageHeader title="오시는 길" section="회사소개" current="/company/location" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid gap-12 md:grid-cols-2">
          {[company.hq, company.factory].map((loc) => (
            <article key={loc.addr}>
              <h2 className="text-[14px] font-bold text-muted">{loc.name}</h2>
              <p className="mt-1.5 text-[20px] font-bold leading-snug">{loc.addr}</p>
              <p className="mt-2 text-[13.5px] text-muted tabular-nums">
                T : {loc.tel} &nbsp;&nbsp; F : {loc.fax}
              </p>
              <LocationMap className="mt-5" height={340} address={loc.addr} label={loc.name} />
            </article>
          ))}
        </div>

        <p className="mt-12 text-[13.5px] text-muted">
          대표번호{" "}
          <a href={`tel:${company.tel}`} className="font-bold text-ink tabular-nums hover:text-brand">
            {company.tel}
          </a>
        </p>
      </section>
    </>
  );
}
