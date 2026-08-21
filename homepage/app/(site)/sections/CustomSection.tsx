import Link from "next/link";

/* 관리자가 편집기에서 추가한 섹션을 그리는 렌더러.
   실제 홈페이지와 편집기 캔버스가 이 같은 컴포넌트를 쓴다(디자인이 어긋나지 않도록). */

export type CustomSectionType =
  | "imageText"
  | "textImage"
  | "text"
  | "gallery"
  | "video"
  | "cta"
  | "stats"
  | "banner"
  | "spacer";

export type CustomSectionData = {
  id: string;
  type: CustomSectionType;
  label?: string;
  content: {
    title?: string;
    subtitle?: string;
    body?: string;
    image?: string;
    images?: string[];
    video?: string;
    buttonText?: string;
    buttonLink?: string;
    items?: { value?: string; label?: string }[];
    height?: string;
  };
};

const WRAP = "mx-auto max-w-[1180px] px-5";

export default function CustomSection({
  data,
  styleOf,
}: {
  data: CustomSectionData;
  styleOf: (path: string) => React.CSSProperties | undefined;
}) {
  const { id, type, content: c } = data;
  const P = `customSections.${id}.content`;
  const st = (k: string) => styleOf(`${P}.${k}`);

  const common = {
    "data-section": id,
    "data-section-label": data.label ?? LABELS[type] ?? "섹션",
    "data-custom": "1",
    style: styleOf(`section.${id}`),
  } as const;

  const Title = () =>
    c.title ? (
      <h2 data-edit={`${P}.title`} style={st("title")} className="sec-title">
        {c.title}
      </h2>
    ) : null;

  const Subtitle = () =>
    c.subtitle ? (
      <p
        data-edit={`${P}.subtitle`}
        style={st("subtitle")}
        className="mt-3 text-center text-[13px] font-bold leading-relaxed text-muted"
      >
        {c.subtitle}
      </p>
    ) : null;

  const Body = () =>
    c.body ? (
      <p
        data-edit={`${P}.body`}
        data-edit-multiline="1"
        style={st("body")}
        className="mt-4 text-[14.5px] leading-[1.9] text-muted"
      >
        {c.body.split("\n").map((l, i) => (
          <span key={i} className="block">{l}</span>
        ))}
      </p>
    ) : null;

  const Button = () =>
    c.buttonText ? (
      <div className="mt-7">
        <Link
          href={c.buttonLink || "/support/oem"}
          data-edit={`${P}.buttonText`}
          data-btn={`${P}.buttonText`}
          style={st("buttonText")}
          className="inline-block bg-brand px-7 py-3.5 text-[13.5px] font-bold text-white transition-colors hover:bg-brand-deep"
        >
          {c.buttonText}
        </Link>
      </div>
    ) : null;

  const Img = ({ src, path, className }: { src: string; path: string; className: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      data-img={path}
      style={styleOf(path)}
      alt={c.title ?? "이미지"}
      className={className}
      loading="lazy"
      width={1200}
      height={800}
    />
  );

  switch (type) {
    case "imageText":
    case "textImage": {
      const reverse = type === "textImage";
      return (
        <section {...common} className={`${WRAP} py-16`}>
          <div className={`grid items-center gap-12 md:grid-cols-2 ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
            {c.image ? (
              <Img src={c.image} path={`${P}.image`} className="content-img aspect-[4/3] object-cover" />
            ) : (
              <Placeholder kind="image" path={`${P}.image`} />
            )}
            <div className={reverse ? "md:text-right" : ""}>
              <Title />
              <Body />
              <Button />
            </div>
          </div>
        </section>
      );
    }

    case "text":
      return (
        <section {...common} className={`${WRAP} py-16 text-center`}>
          <Title />
          <Subtitle />
          <div className="mx-auto max-w-2xl text-left">
            <Body />
          </div>
          <div className="text-center">
            <Button />
          </div>
        </section>
      );

    case "gallery": {
      const imgs = c.images?.length ? c.images : [];
      return (
        <section {...common} className={`${WRAP} py-16`}>
          <Title />
          <Subtitle />
          <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
            {imgs.length ? (
              imgs.map((src, i) => (
                <Img key={i} src={src} path={`${P}.images.${i}`} className="aspect-[4/3] w-full object-cover" />
              ))
            ) : (
              <Placeholder kind="image" path={`${P}.images.0`} />
            )}
          </div>
        </section>
      );
    }

    case "video":
      return (
        <section {...common} className="relative overflow-hidden bg-dark" style={{ ...styleOf(`section.${id}`), height: c.height || "clamp(360px,50vh,560px)" }}>
          {c.video ? (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              style={styleOf(`${P}.video`)}
              data-video={`${P}.video`}
              src={c.video}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
            />
          ) : null}
          <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
          <div className="relative flex h-full flex-col items-center justify-center px-5 text-center text-white">
            {c.title && (
              <h2 data-edit={`${P}.title`} style={st("title")} className="text-[clamp(1.3rem,3vw,2.2rem)] font-bold drop-shadow-md">
                {c.title}
              </h2>
            )}
            {c.body && (
              <p data-edit={`${P}.body`} style={st("body")} className="mt-4 max-w-xl text-[14.5px] leading-relaxed drop-shadow">
                {c.body}
              </p>
            )}
            <Button />
          </div>
        </section>
      );

    case "banner":
      return (
        <section {...common} className="relative overflow-hidden" style={{ ...styleOf(`section.${id}`), height: c.height || "clamp(240px,34vh,420px)" }}>
          {c.image ? (
            <Img src={c.image} path={`${P}.image`} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-surface-2" />
          )}
          <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
          <div className="relative flex h-full flex-col items-center justify-center px-5 text-center text-white">
            {c.title && (
              <h2 data-edit={`${P}.title`} style={st("title")} className="text-[clamp(1.3rem,3vw,2.2rem)] font-bold drop-shadow-md">
                {c.title}
              </h2>
            )}
            <Button />
          </div>
        </section>
      );

    case "stats": {
      const items = c.items?.length ? c.items : [];
      return (
        <section {...common} className="border-y border-line bg-surface-2">
          <div className={`${WRAP} py-14`}>
            <Title />
            <dl className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
              {items.map((it, i) => (
                <div key={i} className="text-center">
                  <dd
                    data-edit={`${P}.items.${i}.value`}
                    style={styleOf(`${P}.items.${i}.value`)}
                    className="text-[1.9rem] font-extrabold tracking-tight tabular-nums"
                  >
                    {it.value}
                  </dd>
                  <dt
                    data-edit={`${P}.items.${i}.label`}
                    style={styleOf(`${P}.items.${i}.label`)}
                    className="mt-1 text-[12.5px] font-semibold text-muted"
                  >
                    {it.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      );
    }

    case "cta":
      return (
        <section {...common} className="border-y border-line bg-brand-soft">
          <div className={`${WRAP} py-14 text-center`}>
            <Title />
            <Body />
            <Button />
          </div>
        </section>
      );

    case "spacer":
      return <section {...common} style={{ ...styleOf(`section.${id}`), height: c.height || "60px" }} aria-hidden="true" />;

    default:
      return null;
  }
}

const LABELS: Record<string, string> = {
  imageText: "이미지 + 텍스트",
  textImage: "텍스트 + 이미지",
  text: "텍스트",
  gallery: "사진 모음",
  video: "영상 배너",
  banner: "이미지 배너",
  stats: "숫자 강조",
  cta: "문의 유도",
  spacer: "여백",
};

/** 사진이 아직 없을 때 — 깨진 이미지 대신 안내 자리 */
function Placeholder({ kind, path }: { kind: "image" | "video"; path: string }) {
  return (
    <div
      data-img={path}
      className="grid aspect-[4/3] w-full place-items-center border border-dashed border-line-strong bg-surface-2 text-[13px] text-faint"
    >
      {kind === "image" ? "사진 추가" : "영상 추가"}
    </div>
  );
}
