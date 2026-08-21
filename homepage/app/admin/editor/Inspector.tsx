"use client";

import { Group, Row, TextInput, Select, NumberSlider, ColorInput, AlignPicker, Uploader, Toggle, inp } from "./ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Selection = {
  kind: "text" | "image" | "video" | "button" | "section";
  path: string;
  text?: string;
  src?: string;
  alt?: string;
  label?: string;
} | null;

const FONTS = [
  { v: "", l: "기본 (사이트 글꼴)" },
  { v: "'NanumSquare', sans-serif", l: "나눔스퀘어" },
  { v: "'Pretendard Variable', Pretendard, sans-serif", l: "프리텐다드" },
  { v: "'Noto Sans KR', sans-serif", l: "본고딕" },
  { v: "'Nanum Myeongjo', serif", l: "나눔명조 (세리프)" },
];

const WEIGHTS = [
  { v: "", l: "기본" },
  { v: "400", l: "보통 400" },
  { v: "500", l: "중간 500" },
  { v: "700", l: "굵게 700" },
  { v: "800", l: "매우 굵게 800" },
  { v: "900", l: "가장 굵게 900" },
];

const FITS = [
  { v: "", l: "기본" },
  { v: "cover", l: "꽉 채우기 (cover)" },
  { v: "contain", l: "전체 보이기 (contain)" },
  { v: "fill", l: "늘리기 (fill)" },
];

const POSITIONS = [
  { v: "", l: "기본 (가운데)" },
  { v: "center top", l: "위쪽" },
  { v: "center center", l: "가운데" },
  { v: "center bottom", l: "아래쪽" },
  { v: "left center", l: "왼쪽" },
  { v: "right center", l: "오른쪽" },
];

export default function Inspector({
  sel,
  draft,
  getValue,
  setValue,
  getStyle,
  setStyle,
  layout,
  setLayout,
  onInline,
}: {
  sel: Selection;
  draft: any;
  getValue: (path: string) => any;
  setValue: (path: string, v: any) => void;
  getStyle: (path: string, prop: string) => string;
  setStyle: (path: string, prop: string, v: string) => void;
  layout: { order: string[]; hidden: string[] };
  setLayout: (l: { order: string[]; hidden: string[] }) => void;
  onInline: (path: string) => void;
}) {
  if (!sel) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-[13px] font-bold text-[#c8ccd2]">편집할 곳을 클릭하세요</p>
        <p className="mt-2 text-[12px] leading-relaxed text-[#7b828c]">
          화면에서 글자·사진·영상을 누르면
          <br />
          여기에 설정이 나타납니다.
        </p>
      </div>
    );
  }

  const S = (prop: string) => getStyle(sel.path, prop);
  const setS = (prop: string) => (v: string) => setStyle(sel.path, prop, v);

  /* ── 글자 / 버튼 ── */
  if (sel.kind === "text" || sel.kind === "button") {
    const isBtn = sel.kind === "button";
    return (
      <>
        <Group title={isBtn ? "버튼 문구" : "글 내용"}>
          <textarea
            className={`${inp} min-h-[76px] resize-y leading-relaxed`}
            value={String(getValue(sel.path) ?? "")}
            onChange={(e) => setValue(sel.path, e.target.value)}
          />
          <button
            type="button"
            onClick={() => onInline(sel.path)}
            className="mt-2 w-full rounded-md border border-[#2a2e34] py-1.5 text-[12px] text-[#9aa1ab] transition-colors hover:border-[#e8261e] hover:text-[#ff6a5e]"
          >
            화면에서 바로 고치기
          </button>
        </Group>

        {isBtn && (
          <Group title="링크">
            <TextInput
              value={String(getValue(sel.path.replace(/\.[^.]+$/, ".link")) ?? "")}
              onChange={(v) => setValue(sel.path.replace(/\.[^.]+$/, ".link"), v)}
              placeholder="/products/hmr"
            />
          </Group>
        )}

        <Group title="글꼴">
          <Row label="글꼴"><Select value={S("fontFamily")} onChange={setS("fontFamily")} options={FONTS} /></Row>
          <Row label="크기"><NumberSlider value={S("fontSize")} onChange={setS("fontSize")} min={10} max={80} /></Row>
          <Row label="굵기"><Select value={S("fontWeight")} onChange={setS("fontWeight")} options={WEIGHTS} /></Row>
          <Row label="자간"><NumberSlider value={S("letterSpacing")} onChange={setS("letterSpacing")} min={-3} max={6} step={0.1} /></Row>
          <Row label="행간"><NumberSlider value={S("lineHeight")} onChange={setS("lineHeight")} min={1} max={3} step={0.05} unit="" placeholder="기본" /></Row>
        </Group>

        <Group title="정렬 · 색">
          <Row label="정렬"><AlignPicker value={S("textAlign")} onChange={setS("textAlign")} /></Row>
          <Row label="글자색"><ColorInput value={S("color")} onChange={setS("color")} /></Row>
        </Group>

        <Group title="여백">
          <Row label="위"><NumberSlider value={S("paddingTop")} onChange={setS("paddingTop")} min={0} max={120} /></Row>
          <Row label="아래"><NumberSlider value={S("paddingBottom")} onChange={setS("paddingBottom")} min={0} max={120} /></Row>
        </Group>
      </>
    );
  }

  /* ── 사진 ── */
  if (sel.kind === "image") {
    const cur = String(getValue(sel.path) ?? "");
    return (
      <>
        <Group title="사진">
          {cur && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cur} alt="" className="mb-3 max-h-36 w-full rounded-md border border-[#2a2e34] object-contain bg-[#15181c]" />
          )}
          <Uploader
            label="사진 바꾸기"
            hint="여기로 파일을 끌어다 놓아도 됩니다"
            onUploaded={(url) => setValue(sel.path, url)}
          />
          <div className="mt-2">
            <TextInput value={cur} onChange={(v) => setValue(sel.path, v)} placeholder="/uploads/사진.jpg" />
          </div>
          {cur && (
            <button
              type="button"
              onClick={() => setValue(sel.path, "")}
              className="mt-2 w-full rounded-md border border-[#3a2020] py-1.5 text-[12px] text-[#ff6a5e] transition-colors hover:border-[#ff6a5e]"
            >
              사진 지우기
            </button>
          )}
        </Group>

        <Group title="채우기 · 위치">
          <Row label="채우기"><Select value={S("objectFit")} onChange={setS("objectFit")} options={FITS} /></Row>
          <Row label="위치"><Select value={S("objectPosition")} onChange={setS("objectPosition")} options={POSITIONS} /></Row>
          <Row label="확대"><NumberSlider value={S("transform")} onChange={(v) => setS("transform")(v)} min={100} max={200} unit="%" placeholder="100%" /></Row>
        </Group>

        <Group title="크기">
          <Row label="높이"><NumberSlider value={S("height")} onChange={setS("height")} min={80} max={800} /></Row>
          <Row label="모서리"><NumberSlider value={S("borderRadius")} onChange={setS("borderRadius")} min={0} max={60} /></Row>
        </Group>
      </>
    );
  }

  /* ── 영상 ── */
  if (sel.kind === "video") {
    const cur = String(getValue(sel.path) ?? "");
    const home = draft.home ?? {};
    return (
      <>
        <Group title="배경 영상">
          {cur && <video src={cur} muted className="mb-3 max-h-36 w-full rounded-md border border-[#2a2e34] object-cover" />}
          <Uploader accept="video/mp4" label="영상 바꾸기 (MP4)" hint="끌어다 놓기 가능 · 최대 40MB" onUploaded={(url) => setValue(sel.path, url)} />
          <div className="mt-2">
            <TextInput value={cur} onChange={(v) => setValue(sel.path, v)} placeholder="/uploads/영상.mp4" />
          </div>
        </Group>

        <Group title="모바일 영상">
          <p className="mb-2 text-[11.5px] leading-relaxed text-[#7b828c]">
            비워두면 휴대폰에서도 위 영상이 나옵니다.
          </p>
          <Uploader accept="video/mp4" label="모바일 전용 영상 올리기" onUploaded={(url) => setValue("home.heroVideoMobile", url)} />
          <div className="mt-2">
            <TextInput
              value={String(home.heroVideoMobile ?? "")}
              onChange={(v) => setValue("home.heroVideoMobile", v)}
              placeholder="(비움 = 같은 영상)"
            />
          </div>
        </Group>

        <Group title="대표 이미지 (Poster)">
          <Uploader label="영상 로딩 전 보일 사진" onUploaded={(url) => setValue("home.heroPoster", url)} />
          <div className="mt-2">
            <TextInput value={String(home.heroPoster ?? "")} onChange={(v) => setValue("home.heroPoster", v)} placeholder="(비움 = 없음)" />
          </div>
        </Group>

        <Group title="재생">
          <Toggle checked={home.heroAutoplay !== false} onChange={(v) => setValue("home.heroAutoplay", v)} label="자동 재생" />
          <Toggle checked={home.heroLoop !== false} onChange={(v) => setValue("home.heroLoop", v)} label="반복 재생" />
          <Toggle checked={home.heroMuted !== false} onChange={(v) => setValue("home.heroMuted", v)} label="소리 끄기" />
        </Group>

        <Group title="화면 채우기">
          <Row label="채우기"><Select value={S("objectFit")} onChange={setS("objectFit")} options={FITS} /></Row>
          <Row label="위치"><Select value={S("objectPosition")} onChange={setS("objectPosition")} options={POSITIONS} /></Row>
        </Group>

        <Group title="어둡게 덮기">
          <p className="mb-2 text-[11.5px] leading-relaxed text-[#7b828c]">
            글자가 잘 보이도록 영상 위를 덮는 정도입니다.
          </p>
          <NumberSlider
            value={String(home.heroOverlay ?? 0.3)}
            onChange={(v) => setValue("home.heroOverlay", parseFloat(v) || 0)}
            min={0}
            max={0.9}
            step={0.05}
            unit=""
            placeholder="0.3"
          />
        </Group>
      </>
    );
  }

  /* ── 섹션 ── */
  const id = sel.path;
  const hidden = layout.hidden.includes(id);
  const idx = layout.order.indexOf(id);

  const move = (d: number) => {
    const t = idx + d;
    if (idx < 0 || t < 0 || t >= layout.order.length) return;
    const order = [...layout.order];
    [order[idx], order[t]] = [order[t], order[idx]];
    setLayout({ ...layout, order });
  };

  return (
    <>
      <Group title="섹션">
        <p className="text-[13px] font-bold text-[#e8eaed]">{sel.label ?? id}</p>
        <p className="mt-1 text-[11.5px] text-[#7b828c]">
          순서 {idx + 1} / {layout.order.length}
        </p>
        <div className="mt-3 flex gap-1.5">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={idx <= 0}
            className="flex-1 rounded-md border border-[#2a2e34] py-1.5 text-[12px] text-[#9aa1ab] transition-colors hover:border-[#4a5058] hover:text-[#e8eaed] disabled:opacity-40"
          >
            ↑ 위로
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={idx < 0 || idx >= layout.order.length - 1}
            className="flex-1 rounded-md border border-[#2a2e34] py-1.5 text-[12px] text-[#9aa1ab] transition-colors hover:border-[#4a5058] hover:text-[#e8eaed] disabled:opacity-40"
          >
            ↓ 아래로
          </button>
        </div>
      </Group>

      <Group title="표시">
        <Toggle
          checked={!hidden}
          onChange={(v) =>
            setLayout({
              ...layout,
              hidden: v ? layout.hidden.filter((x) => x !== id) : [...layout.hidden, id],
            })
          }
          label="홈페이지에 보이기"
        />
        {hidden && (
          <p className="mt-1 text-[11.5px] text-[#ff6a5e]">지금은 숨겨져 있어 방문자에게 보이지 않습니다.</p>
        )}
      </Group>

      <Group title="배경 · 여백">
        <Row label="배경색"><ColorInput value={S("backgroundColor")} onChange={setS("backgroundColor")} /></Row>
        <Row label="위 여백"><NumberSlider value={S("paddingTop")} onChange={setS("paddingTop")} min={0} max={200} /></Row>
        <Row label="아래 여백"><NumberSlider value={S("paddingBottom")} onChange={setS("paddingBottom")} min={0} max={200} /></Row>
        {id === "hero" && (
          <Row label="높이"><NumberSlider value={S("height")} onChange={setS("height")} min={240} max={900} /></Row>
        )}
      </Group>
    </>
  );
}
