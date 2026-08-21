import Link from "next/link";
import LocationMap from "@/app/components/LocationMap";
import { content, company, lines, sectionOrder, isHidden, styleOf } from "@/lib/content";

/* 원본 홈 구성 그대로: 히어로 영상 → 소개 영상 3편 → 식품제조/유통 2단 → PRODUCT → 오시는 길
   - 문구·사진은 content/site.json 에서 관리 (/admin/editor 에서 편집)
   - data-edit / data-img / data-video / data-btn / data-section 은 비주얼 편집기가 요소를 알아보는 표시.
     일반 방문자 화면에는 아무 영향이 없다. */

const PAGE = "home";

export default function Home() {
  const h = content.home;

  const sections: Record<string, React.ReactNode> = {
    /* ── 히어로 영상 ── */
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
          poster={(h as { heroPoster?: string }).heroPoster || undefined}
          autoPlay={(h as { heroAutoplay?: boolean }).heroAutoplay !== false}
          muted={(h as { heroMuted?: boolean }).heroMuted !== false}
          loop={(h as { heroLoop?: boolean }).heroLoop !== false}
          playsInline
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{ background: `rgba(0,0,0,${(h as { heroOverlay?: number }).heroOverlay ?? 0.3})` }}
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
            {lines(h.heroTitleKo).map((l, i) => (
              <span key={i} className="block">{l}</span>
            ))}
          </h1>
        </div>
      </section>
    ),

    /* ── 소개 영상 ── */
    videos: h.videos.length > 0 && (
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
    ),

    /* ── 식품 제조 / 식품 유통·물류·수출입 ── */
    cards: (
      <section
        key="cards"
        data-section="cards"
        data-section-label="소개 카드"
        style={styleOf("section.cards")}
        className="mx-auto max-w-[1180px] px-5 pb-16"
      >
        <div className="grid gap-10 md:grid-cols-2">
          {h.cards.map((card, i) => (
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

    /* ── PRODUCT ── */
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
          {lines(h.productDesc).map((l, i) => (
            <span key={i} className="block">{l}</span>
          ))}
        </p>

        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
          {h.productPhotos.map((src, i) => (
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

    /* ── 오시는 길 ── */
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
      {sectionOrder(PAGE).map((id) =>
        isHidden(PAGE, id) ? null : sections[id] ?? null
      )}
    </>
  );
}
