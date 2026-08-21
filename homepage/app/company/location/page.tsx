import type { Metadata } from "next";
import PageHeader from "../../components/PageHeader";
import LocationMap from "../../components/LocationMap";
import { COMPANY_INFO as C } from "../../components/nav";

export const metadata: Metadata = {
  title: "오시는 길",
  description: "㈜비엔에프글로벌 본사(경기 하남시 산곡로 8)와 제조공장(경기 이천시 백사면 이여로 260-15) 위치 안내.",
};

export default function LocationPage() {
  const locations = [
    { name: C.name, ...C.hq },
    { name: `${C.name} 제조공장`, ...C.factory },
  ];

  return (
    <>
      <PageHeader title="오시는 길" section="회사소개" current="/company/location" />

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid gap-12 md:grid-cols-2">
          {locations.map((loc) => (
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
          <a href={`tel:${C.tel}`} className="font-bold text-ink tabular-nums hover:text-brand">
            {C.tel}
          </a>
        </p>
      </section>
    </>
  );
}
