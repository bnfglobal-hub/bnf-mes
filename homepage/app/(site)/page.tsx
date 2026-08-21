import Link from "next/link";
import LocationMap from "@/app/components/LocationMap";
import { content, company, lines } from "@/lib/content";

/* 원본 홈 구성 그대로: 히어로 영상 → 소개 영상 3편 → 식품제조/유통 2단 → PRODUCT → 오시는 길
   모든 문구·사진은 content/site.json 에서 관리 (/admin 에서 수정) */

export default function Home() {
  const h = content.home;

  return (
    <>
      {/* ── 히어로 영상 ── */}
      <section className="relative h-[clamp(420px,62vh,620px)] overflow-hidden bg-dark">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={h.heroVideo}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
        <div className="relative flex h-full flex-col items-center justify-center px-5 text-center text-white">
          <p className="text-[clamp(1.3rem,3.4vw,2.4rem)] font-bold tracking-tight drop-shadow-md">
            {h.heroTitleEn}
          </p>
          <h1 className="mt-10 text-[clamp(1.15rem,2.8vw,2rem)] font-bold leading-[1.6] drop-shadow-md">
            {lines(h.heroTitleKo).map((l, i) => (
              <span key={i} className="block">{l}</span>
            ))}
          </h1>
        </div>
      </section>

      {/* ── 소개 영상 ── */}
      {h.videos.length > 0 && (
        <section aria-label="회사 소개 영상" className="mx-auto max-w-[1180px] px-5 py-14">
          <div className="grid gap-6 md:grid-cols-3">
            {h.videos.map((v) => (
              <div key={v.id} className="aspect-video overflow-hidden bg-surface-2">
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
      )}

      {/* ── 식품 제조 / 식품 유통·물류·수출입 ── */}
      <section className="mx-auto max-w-[1180px] px-5 pb-16">
        <div className="grid gap-10 md:grid-cols-2">
          {h.cards.map((card) => (
            <article key={card.title} className="text-center">
              <h2 className="sec-title">{card.title}</h2>
              <p className="mt-3 text-[13px] font-bold leading-relaxed text-muted">{card.desc}</p>
              <Link href={card.link} className="mt-6 block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.image}
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

      {/* ── PRODUCT ── */}
      <section aria-labelledby="product-h" className="mx-auto max-w-[1180px] px-5 pb-16">
        <h2 id="product-h" className="sec-title">{h.productTitle}</h2>
        <p className="mt-4 text-center text-[13px] font-bold leading-[1.9] text-muted">
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
            className="inline-block bg-dark px-7 py-3.5 text-[13.5px] font-bold text-white transition-colors hover:bg-brand"
          >
            {h.productButton}
          </Link>
        </div>
      </section>

      {/* ── 오시는 길 ── */}
      <section aria-labelledby="loc-h" className="border-t border-line bg-surface-2">
        <div className="mx-auto max-w-[1180px] px-5 py-14">
          <h2 id="loc-h" className="sec-title">{h.locationTitle}</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            {[company.hq, company.factory].map((loc) => (
              <article key={loc.addr}>
                <h3 className="text-[14px] font-bold text-muted">{loc.name}</h3>
                <p className="mt-1 text-[18px] font-bold">{loc.addr}</p>
                <p className="mt-1.5 text-[13px] text-muted tabular-nums">
                  T : {loc.tel} &nbsp; F : {loc.fax}
                </p>
                <LocationMap className="mt-4" height={300} address={loc.addr} label={loc.name} />
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
