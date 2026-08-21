import Link from "next/link";
import LocationMap from "@/app/components/LocationMap";
import CustomSection, { type CustomSectionData } from "./sections/CustomSection";
import { makeHelpers, type SiteData } from "@/lib/render";

/* 홈 화면의 실제 렌더러.
   - 방문자 화면(app/(site)/page.tsx)과 편집기 캔버스(app/admin/preview)가 이 컴포넌트를 함께 쓴다.
   - data-edit / data-img / data-video / data-btn / data-section 은 편집기가 요소를 알아보는 표시로,
     방문자 화면에는 아무 영향이 없다. */

const PAGE = "home";
const BUILTINS = ["hero", "videos", "cards", "product", "location"];

type HomeData = {
  heroVideo: string;
  heroVideoMobile?: string;
  heroPoster?: string;
  heroAutoplay?: boolean;
  heroMuted?: boolean;
  heroLoop?: boolean;
  heroOverlay?: number;
  heroTitleEn: string;
  heroTitleKo: string;
  videos: { id: string; title: string }[];
  cards: { title: string; desc: string; image: string; link: string }[];
  productTitle: string;
  productDesc: string;
  productPhotos: string[];
  productButton: string;
  locationTitle: string;
};

type Loc = { name: string; addr: string; tel: string; fax: string };

export default function HomeSections({ data }: { data: SiteData }) {
  const H = makeHelpers(data);
  const h = (data.home ?? {}) as HomeData;
  const company = data.company as { hq: Loc; factory: Loc };
  const styleOf = H.styleOf;

  const sections: Record<string, React.ReactNode> = {
    hero: (
      <section
        key="hero"
        data-section="hero"
        data-section-label="첫 화면(영상)"
        style={styleOf("section.hero")}
        className="relative h-[clamp(420px,62vh,620px)] overflow-hidden bg-dark"
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          style={styleOf("home.heroVideo")}
          data-video="home.heroVideo"
          src={h.heroVideo}
          preload="metadata"
          poster={h.heroPoster || undefined}
          autoPlay={h.heroAutoplay !== false}
          muted={h.heroMuted !== false}
          loop={h.heroLoop !== false}
          playsInline
          aria-hidden="true"
        />
        {h.heroVideoMobile ? (
          <style
            // 모바일에서는 전용 영상만 보이게
            dangerouslySetInnerHTML={{
              __html:
                "@media(max-width:767px){[data-video='home.heroVideo']{display:none}[data-video='home.heroVideoMobile']{display:block}}@media(min-width:768px){[data-video='home.heroVideoMobile']{display:none}}",
            }}
          />
        ) : null}
        {h.heroVideoMobile ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            data-video="home.heroVideoMobile"
            src={h.heroVideoMobile}
            preload="metadata"
            autoPlay={h.heroAutoplay !== false}
            muted={h.heroMuted !== false}
            loop={h.heroLoop !== false}
            playsInline
            aria-hidden="true"
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{ background: `rgba(0,0,0,${h.heroOverlay ?? 0.3})` }}
          data-overlay="home.heroOverlay"
          aria-hidden="true"
        />
        <div className="relative flex h-full flex-col items-center justify-center px-5 text-center text-white">
          <p
            data-edit="home.heroTitleEn"
            style={styleOf("home.heroTitleEn")}
            className="text-[clamp(1.3rem,3.4vw,2.4rem)] font-bold tracking-tight drop-shadow-md"
          >
            {h.heroTitleEn}
          </p>
          <h1
            data-edit="home.heroTitleKo"
            data-edit-multiline="1"
            style={styleOf("home.heroTitleKo")}
            className="mt-10 text-[clamp(1.15rem,2.8vw,2rem)] font-bold leading-[1.6] drop-shadow-md"
          >
            {H.lines(h.heroTitleKo).map((l, i) => (
              <span key={i} className="block">{l}</span>
            ))}
          </h1>
        </div>
      </section>
    ),

    videos: h.videos?.length ? (
      <section
        key="videos"
        data-section="videos"
        data-section-label="소개 영상"
        style={styleOf("section.videos")}
        aria-label="회사 소개 영상"
        className="mx-auto max-w-[1180px] px-5 py-14"
      >
        <div className="grid gap-6 md:grid-cols-3">
          {h.videos.map((v, i) => (
            <div key={v.id + i} className="aspect-video overflow-hidden bg-surface-2">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${v.id}`}
                title={v.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>
    ) : null,

    cards: (
      <section
        key="cards"
        data-section="cards"
        data-section-label="소개 카드"
        style={styleOf("section.cards")}
        className="mx-auto max-w-[1180px] px-5 pb-16"
      >
        <div className="grid gap-10 md:grid-cols-2">
          {h.cards?.map((card, i) => (
            <article key={card.title + i} className="text-center">
              <h2 data-edit={`home.cards.${i}.title`} style={styleOf(`home.cards.${i}.title`)} className="sec-title">
                {card.title}
              </h2>
              <p
                data-edit={`home.cards.${i}.desc`}
                style={styleOf(`home.cards.${i}.desc`)}
                className="mt-3 text-[13px] font-bold leading-relaxed text-muted"
              >
                {card.desc}
              </p>
              <Link href={card.link} data-btn={`home.cards.${i}.link`} className="mt-6 block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.image}
                  data-img={`home.cards.${i}.image`}
                  style={styleOf(`home.cards.${i}.image`)}
                  alt={card.title}
                  className="content-img aspect-[1000/430] object-cover"
                  width={1000}
                  height={430}
                />
              </Link>
            </article>
          ))}
        </div>
      </section>
    ),

    product: (
      <section
        key="product"
        data-section="product"
        data-section-label="PRODUCT"
        style={styleOf("section.product")}
        aria-labelledby="product-h"
        className="mx-auto max-w-[1180px] px-5 pb-16"
      >
        <h2 id="product-h" data-edit="home.productTitle" style={styleOf("home.productTitle")} className="sec-title">
          {h.productTitle}
        </h2>
        <p
          data-edit="home.productDesc"
          data-edit-multiline="1"
          style={styleOf("home.productDesc")}
          className="mt-4 text-center text-[13px] font-bold leading-[1.9] text-muted"
        >
          {H.lines(h.productDesc).map((l, i) => (
            <span key={i} className="block">{l}</span>
          ))}
        </p>

        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
          {h.productPhotos?.map((src, i) => (
            <Link key={src + i} href="/products/hmr" className="block overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                data-img={`home.productPhotos.${i}`}
                style={styleOf(`home.productPhotos.${i}`)}
                alt={`제조 제품 사진 ${i + 1}`}
                className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                loading="lazy"
                width={400}
                height={300}
              />
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/products/hmr"
            data-edit="home.productButton"
            data-btn="home.productButton"
            style={styleOf("home.productButton")}
            className="inline-block bg-dark px-7 py-3.5 text-[13.5px] font-bold text-white transition-colors hover:bg-brand"
          >
            {h.productButton}
          </Link>
        </div>
      </section>
    ),

    location: (
      <section
        key="location"
        data-section="location"
        data-section-label="오시는 길"
        style={styleOf("section.location")}
        aria-labelledby="loc-h"
        className="border-t border-line bg-surface-2"
      >
        <div className="mx-auto max-w-[1180px] px-5 py-14">
          <h2 id="loc-h" data-edit="home.locationTitle" style={styleOf("home.locationTitle")} className="sec-title">
            {h.locationTitle}
          </h2>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            {[company.hq, company.factory].map((loc, i) => (
              <article key={loc.addr}>
                <h3
                  data-edit={i === 0 ? "company.hq.name" : "company.factory.name"}
                  className="text-[14px] font-bold text-muted"
                >
                  {loc.name}
                </h3>
                <p
                  data-edit={i === 0 ? "company.hq.addr" : "company.factory.addr"}
                  className="mt-1 text-[18px] font-bold"
                >
                  {loc.addr}
                </p>
                <p className="mt-1.5 text-[13px] text-muted tabular-nums">
                  T : {loc.tel} &nbsp; F : {loc.fax}
                </p>
                <LocationMap className="mt-4" height={300} address={loc.addr} label={loc.name} />
              </article>
            ))}
          </div>
        </div>
      </section>
    ),
  };

  return (
    <>
      {H.sectionOrder(PAGE, BUILTINS).map((id) => {
        if (H.isHidden(PAGE, id)) return null;
        if (sections[id] !== undefined) return sections[id];
        const cs = H.customSection(id);
        return cs ? <CustomSection key={id} data={cs as CustomSectionData} styleOf={styleOf} /> : null;
      })}
    </>
  );
}
