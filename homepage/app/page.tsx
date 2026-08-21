import Link from "next/link";
import LocationMap from "./components/LocationMap";
import { COMPANY_INFO as C } from "./components/nav";

/* 원본 홈 구성을 그대로 옮김:
   히어로 영상 → 소개 영상 3편 → 식품제조/유통 2단 → PRODUCT 8종 → 오시는 길 */

const YOUTUBE = [
  { id: "fd5kjjPfM0w", title: "B&F GLOBAL 소개 영상 1" },
  { id: "Ax7XOslFB_o", title: "B&F GLOBAL 소개 영상 2" },
  { id: "ef_KAUOg0HU", title: "B&F GLOBAL 소개 영상 3" },
];

const PRODUCT_PHOTOS = [
  "/home/p1.png",
  "/home/p2.png",
  "/home/p3.png",
  "/home/p4.png",
  "/home/p5.png",
  "/home/p6.png",
  "/home/p7.png",
  "/home/p8.png",
];

export default function Home() {
  return (
    <>
      {/* ── 히어로 영상 ── */}
      <section className="relative h-[clamp(420px,62vh,620px)] overflow-hidden bg-dark">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
        <div className="relative flex h-full flex-col items-center justify-center px-5 text-center text-white">
          <p className="text-[clamp(1.3rem,3.4vw,2.4rem)] font-bold tracking-tight drop-shadow-md">
            Delivering Quality Food With Trust and Care
          </p>
          <h1 className="mt-10 text-[clamp(1.15rem,2.8vw,2rem)] font-bold leading-[1.6] drop-shadow-md">
            철저한 품질 경영을 기반으로 시작하는 새로운 식문화
            <br />
            {C.name}이 함께 합니다.
          </h1>
        </div>
      </section>

      {/* ── 소개 영상 3편 ── */}
      <section aria-label="회사 소개 영상" className="mx-auto max-w-[1180px] px-5 py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {YOUTUBE.map((v) => (
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

      {/* ── 식품 제조 / 식품 유통·물류·수출입 ── */}
      <section className="mx-auto max-w-[1180px] px-5 pb-16">
        <div className="grid gap-10 md:grid-cols-2">
          <article className="text-center">
            <h2 className="sec-title">식품 제조</h2>
            <p className="mt-3 text-[13px] font-bold leading-relaxed text-muted">
              즉석조리식품 · 식육추출가공품 · 소스 · 수산물 가공품 · 절임식품 ·
              양념육 · 냉동 면류
            </p>
            <Link href="/company/manufacturing" className="mt-6 block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/home/mfg.png"
                alt="소이연남 태국 소고기 쌀국수 밀키트 구성품"
                className="content-img aspect-[1000/430] object-cover"
                width={1000}
                height={430}
              />
            </Link>
          </article>

          <article className="text-center">
            <h2 className="sec-title">식품 유통·물류·수출입</h2>
            <p className="mt-3 text-[13px] font-bold leading-relaxed text-muted">
              냉동 축산가공품, 수산가공품 등 다양한 원재료 공급
            </p>
            <Link href="/company/business" className="mt-6 block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/home/dist.jpg"
                alt="경기 이천 제조공장 전경"
                className="content-img aspect-[1000/430] object-cover"
                width={1000}
                height={430}
              />
            </Link>
          </article>
        </div>
      </section>

      {/* ── PRODUCT ── */}
      <section aria-labelledby="product-h" className="mx-auto max-w-[1180px] px-5 pb-16">
        <h2 id="product-h" className="sec-title">PRODUCT</h2>
        <p className="mt-4 text-center text-[13px] font-bold leading-[1.9] text-muted">
          엄선된 재료로 만들어진 높은 퀄리티의 제품
          <br />
          지금까지 경험해보지 못한 간편식을 만나보세요.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
          {PRODUCT_PHOTOS.map((src, i) => (
            <Link key={src} href="/products/hmr" className="block overflow-hidden">
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
            상품 자세히 보기
          </Link>
        </div>
      </section>

      {/* ── 오시는 길 ── */}
      <section aria-labelledby="loc-h" className="border-t border-line bg-surface-2">
        <div className="mx-auto max-w-[1180px] px-5 py-14">
          <h2 id="loc-h" className="sec-title">오시는 길</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            {[C.hq, C.factory].map((loc, i) => (
              <article key={loc.addr}>
                <h3 className="text-[14px] font-bold text-muted">
                  {i === 0 ? C.name : `${C.name} 제조공장`}
                </h3>
                <p className="mt-1 text-[18px] font-bold">{loc.addr}</p>
                <p className="mt-1.5 text-[13px] text-muted tabular-nums">
                  T : {loc.tel} &nbsp; F : {loc.fax}
                </p>
                <LocationMap className="mt-4" height={300} address={loc.addr} label="B&F GLOBAL" />
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
