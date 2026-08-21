"use client";

import { Group, Row, TextInput, Select, NumberSlider, ColorInput, AlignPicker, Toggle, SpacingBox, inp } from "./ui";
import type { SiteDraft } from "./types";
import type { DeviceId } from "./Toolbar";

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
];

const WEIGHTS = [
  { v: "", l: "기본" },
  { v: "400", l: "보통" },
  { v: "500", l: "조금 굵게" },
  { v: "700", l: "굵게" },
  { v: "800", l: "매우 굵게" },
  { v: "900", l: "가장 굵게" },
];

const FITS = [
  { v: "", l: "기본" },
  { v: "cover", l: "화면 채우기" },
  { v: "contain", l: "전체 보이기" },
];

const RADIUS = [
  { v: "", l: "기본" },
  { v: "0px", l: "각지게" },
  { v: "8px", l: "살짝 둥글게" },
  { v: "16px", l: "둥글게" },
  { v: "28px", l: "많이 둥글게" },
  { v: "9999px", l: "원형" },
];

export default function Inspector({
  sel,
  draft,
  device,
  getValue,
  setValue,
  getStyle,
  setStyle,
  layout,
  setLayout,
  onInline,
  onPickMedia,
  onDuplicate,
  onDelete,
  isCustom,
}: {
  sel: Selection;
  draft: SiteDraft;
  device: DeviceId;
  getValue: (path: string) => unknown;
  setValue: (path: string, v: unknown) => void;
  getStyle: (path: string, prop: string) => string;
  setStyle: (path: string, prop: string, v: string) => void;
  layout: { order: string[]; hidden: string[] };
  setLayout: (l: { order: string[]; hidden: string[] }, structural?: boolean) => void;
  onInline: (path: string) => void;
  onPickMedia: (path: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  isCustom: boolean;
}) {
  if (!sel) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-[13px] font-bold text-[#c8ccd2]">편집할 곳을 클릭하세요</p>
        <p className="mt-2 text-[12px] leading-relaxed text-[#7b828c]">
          화면에서 글자·사진·영상을 누르면
          <br />
          여기에 설정이 나타납니다.
          <br />
          <span className="mt-2 block">글자는 두 번 눌러 바로 고칠 수 있어요.</span>
        </p>
      </div>
    );
  }

  const S = (prop: string) => getStyle(sel.path, prop);
  const setS = (prop: string) => (v: string) => setStyle(sel.path, prop, v);

  const DeviceNote = () =>
    device !== "desktop" ? (
      <p className="mb-3 rounded bg-[#1c2128] px-3 py-2 text-[11.5px] leading-relaxed text-[#8ab4f8]">
        지금 바꾸는 값은 <b>{device === "tablet" ? "태블릿" : "모바일"}</b> 화면에만 적용됩니다.
        PC 화면은 그대로 유지돼요.
      </p>
    ) : null;

  /* ── 글자 / 버튼 ── */
  if (sel.kind === "text" || sel.kind === "button") {
    const isBtn = sel.kind === "button";
    const linkPath = sel.path.replace(/\.[^.]+$/, ".buttonLink");
    return (
      <>
        <Group title={isBtn ? "버튼 문구" : "글 내용"}>
          <DeviceNote />
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
          <Group title="눌렀을 때 갈 곳">
            <TextInput
              value={String(getValue(linkPath) ?? "")}
              onChange={(v) => setValue(linkPath, v)}
              placeholder="/support/oem"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {[
                { l: "OEM 문의", v: "/support/oem" },
                { l: "제조품목", v: "/products/hmr" },
                { l: "회사소개", v: "/company/greeting" },
                { l: "쇼핑몰", v: "https://smartstore.naver.com/bnfglobal" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setValue(linkPath, o.v)}
                  className="rounded border border-[#2a2e34] px-2 py-1 text-[11px] text-[#9aa1ab] transition-colors hover:border-[#e8261e] hover:text-[#ff6a5e]"
                >
                  {o.l}
                </button>
              ))}
            </div>
          </Group>
        )}

        <Group title="글꼴">
          <Row label="글꼴"><Select value={S("fontFamily")} onChange={setS("fontFamily")} options={FONTS} /></Row>
          <Row label="크기"><NumberSlider value={S("fontSize")} onChange={setS("fontSize")} min={10} max={80} /></Row>
          <Row label="굵기"><Select value={S("fontWeight")} onChange={setS("fontWeight")} options={WEIGHTS} /></Row>
          <Row label="자간"><NumberSlider value={S("letterSpacing")} onChange={setS("letterSpacing")} min={-3} max={6} step={0.1} /></Row>
          <Row label="줄 간격"><NumberSlider value={S("lineHeight")} onChange={setS("lineHeight")} min={1} max={3} step={0.05} unit="" /></Row>
        </Group>

        <Group title="정렬 · 색">
          <Row label="정렬"><AlignPicker value={S("textAlign")} onChange={setS("textAlign")} /></Row>
          <Row label="글자색"><ColorInput value={S("color")} onChange={setS("color")} /></Row>
        </Group>

        <Group title="여백">
          <SpacingBox
            top={S("paddingTop")}
            bottom={S("paddingBottom")}
            onTop={setS("paddingTop")}
            onBottom={setS("paddingBottom")}
          />
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
          <DeviceNote />
          {cur ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cur}
              alt=""
              className="mb-3 max-h-32 w-full rounded-md border border-[#2a2e34] bg-[#15181c] object-contain"
            />
          ) : (
            <div className="mb-3 grid h-24 place-items-center rounded-md border border-dashed border-[#33383f] text-[12px] text-[#7b828c]">
              사진 없음
            </div>
          )}
          <button
            type="button"
            onClick={() => onPickMedia(sel.path)}
            className="w-full rounded-md bg-[#e8261e] py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-[#c41c15]"
          >
            사진 바꾸기
          </button>
          <p className="mt-2 text-[11.5px] leading-relaxed text-[#7b828c]">
            화면에서 사진을 클릭하면 모서리를 끌어 크기를 바꾸고,
            <b className="text-[#9aa1ab]"> 잘라내기</b>로 보이는 부분을 옮길 수 있어요.
          </p>
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

        <Group title="보이는 방식">
          <Row label="채우기"><Select value={S("objectFit")} onChange={setS("objectFit")} options={FITS} /></Row>
          <Row label="모서리"><Select value={S("borderRadius")} onChange={setS("borderRadius")} options={RADIUS} /></Row>
          <Row label="투명도"><NumberSlider value={S("opacity")} onChange={setS("opacity")} min={0.1} max={1} step={0.05} unit="" /></Row>
        </Group>

        <Group title="크기 (직접 입력)">
          <Row label="너비"><NumberSlider value={S("width")} onChange={setS("width")} min={60} max={1400} /></Row>
          <Row label="높이"><NumberSlider value={S("height")} onChange={setS("height")} min={60} max={900} /></Row>
          <button
            type="button"
            onClick={() => {
              setStyle(sel.path, "width", "");
              setStyle(sel.path, "height", "");
              setStyle(sel.path, "objectPosition", "");
            }}
            className="mt-1 w-full rounded-md border border-[#2a2e34] py-1.5 text-[12px] text-[#9aa1ab] transition-colors hover:border-[#4a5058] hover:text-[#e8eaed]"
          >
            크기·위치 원래대로
          </button>
        </Group>
      </>
    );
  }

  /* ── 영상 ── */
  if (sel.kind === "video") {
    const cur = String(getValue(sel.path) ?? "");
    const home = (draft.home ?? {}) as Record<string, unknown>;
    const isHero = sel.path === "home.heroVideo";
    return (
      <>
        <Group title="영상">
          <DeviceNote />
          {cur ? (
            <video src={cur} muted className="mb-3 max-h-32 w-full rounded-md border border-[#2a2e34] object-cover" />
          ) : (
            <div className="mb-3 grid h-24 place-items-center rounded-md border border-dashed border-[#33383f] text-[12px] text-[#7b828c]">
              영상 없음
            </div>
          )}
          <button
            type="button"
            onClick={() => onPickMedia(sel.path)}
            className="w-full rounded-md bg-[#e8261e] py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-[#c41c15]"
          >
            영상 바꾸기
          </button>
        </Group>

        {isHero && (
          <>
            <Group title="모바일 전용 영상">
              <p className="mb-2 text-[11.5px] leading-relaxed text-[#7b828c]">
                비워두면 휴대폰에서도 위 영상이 나옵니다.
              </p>
              <button
                type="button"
                onClick={() => onPickMedia("home.heroVideoMobile")}
                className="w-full rounded-md border border-[#2a2e34] py-1.5 text-[12px] text-[#9aa1ab] transition-colors hover:border-[#4a5058] hover:text-[#e8eaed]"
              >
                {home.heroVideoMobile ? "모바일 영상 바꾸기" : "모바일 영상 고르기"}
              </button>
            </Group>

            <Group title="영상 로딩 전 사진">
              <button
                type="button"
                onClick={() => onPickMedia("home.heroPoster")}
                className="w-full rounded-md border border-[#2a2e34] py-1.5 text-[12px] text-[#9aa1ab] transition-colors hover:border-[#4a5058] hover:text-[#e8eaed]"
              >
                {home.heroPoster ? "사진 바꾸기" : "사진 고르기"}
              </button>
            </Group>

            <Group title="재생">
              <Toggle checked={home.heroAutoplay !== false} onChange={(v) => setValue("home.heroAutoplay", v)} label="자동으로 재생" />
              <Toggle checked={home.heroLoop !== false} onChange={(v) => setValue("home.heroLoop", v)} label="계속 반복" />
              <Toggle checked={home.heroMuted !== false} onChange={(v) => setValue("home.heroMuted", v)} label="소리 끄기" />
            </Group>

            <Group title="글자가 잘 보이게 덮기">
              <NumberSlider
                value={String(home.heroOverlay ?? 0.3)}
                onChange={(v) => setValue("home.heroOverlay", parseFloat(v) || 0)}
                min={0}
                max={0.9}
                step={0.05}
                unit=""
              />
              <div className="mt-2 flex gap-1">
                {[["없음", 0], ["약하게", 0.2], ["보통", 0.35], ["강하게", 0.55]].map(([l, v]) => (
                  <button
                    key={String(l)}
                    type="button"
                    onClick={() => setValue("home.heroOverlay", v)}
                    className="flex-1 rounded border border-[#2a2e34] py-1 text-[11px] text-[#9aa1ab] transition-colors hover:border-[#e8261e] hover:text-[#ff6a5e]"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </Group>
          </>
        )}

        <Group title="보이는 방식">
          <Row label="채우기"><Select value={S("objectFit")} onChange={setS("objectFit")} options={FITS} /></Row>
          <p className="mt-1 text-[11.5px] leading-relaxed text-[#7b828c]">
            화면에서 영상을 클릭한 뒤 <b className="text-[#9aa1ab]">잘라내기</b>를 누르면
            영상 안쪽을 끌어 보이는 부분을 맞출 수 있어요.
          </p>
        </Group>
      </>
    );
  }

  /* ── 섹션 ── */
  const id = sel.path;
  const hidden = layout.hidden.includes(id);
  const idx = layout.order.indexOf(id);
  const cs = draft.customSections?.[id];

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
          {isCustom ? " · 추가한 섹션" : " · 기본 섹션"}
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
        {isCustom && (
          <div className="mt-1.5 flex gap-1.5">
            <button
              type="button"
              onClick={() => onDuplicate(id)}
              className="flex-1 rounded-md border border-[#2a2e34] py-1.5 text-[12px] text-[#9aa1ab] transition-colors hover:border-[#4a5058] hover:text-[#e8eaed]"
            >
              복제
            </button>
            <button
              type="button"
              onClick={() => onDelete(id)}
              className="flex-1 rounded-md border border-[#3a2020] py-1.5 text-[12px] text-[#ff6a5e] transition-colors hover:border-[#ff6a5e]"
            >
              삭제
            </button>
          </div>
        )}
      </Group>

      <Group title="표시">
        <Toggle
          checked={!hidden}
          onChange={(v) =>
            setLayout(
              { ...layout, hidden: v ? layout.hidden.filter((x) => x !== id) : [...layout.hidden, id] },
              true
            )
          }
          label="홈페이지에 보이기"
        />
        {hidden && <p className="mt-1 text-[11.5px] text-[#ff6a5e]">지금은 방문자에게 보이지 않습니다.</p>}
      </Group>

      {/* 추가한 섹션의 내용 */}
      {cs && (
        <Group title="이 섹션의 내용">
          {"title" in cs.content && (
            <Row label="제목">
              <TextInput
                value={String(cs.content.title ?? "")}
                onChange={(v) => setValue(`customSections.${id}.content.title`, v)}
              />
            </Row>
          )}
          {"body" in cs.content && (
            <div className="mb-2.5">
              <span className="mb-1 block text-[11.5px] text-[#9aa1ab]">내용</span>
              <textarea
                className={`${inp} min-h-[70px] resize-y`}
                value={String(cs.content.body ?? "")}
                onChange={(e) => setValue(`customSections.${id}.content.body`, e.target.value)}
              />
            </div>
          )}
          {"buttonText" in cs.content && (
            <>
              <Row label="버튼">
                <TextInput
                  value={String(cs.content.buttonText ?? "")}
                  onChange={(v) => setValue(`customSections.${id}.content.buttonText`, v)}
                />
              </Row>
              <Row label="버튼 링크">
                <TextInput
                  value={String(cs.content.buttonLink ?? "")}
                  onChange={(v) => setValue(`customSections.${id}.content.buttonLink`, v)}
                />
              </Row>
            </>
          )}
          {("image" in cs.content || cs.type === "banner" || cs.type === "imageText" || cs.type === "textImage") && (
            <button
              type="button"
              onClick={() => onPickMedia(`customSections.${id}.content.image`)}
              className="mt-1 w-full rounded-md border border-[#2a2e34] py-1.5 text-[12px] text-[#9aa1ab] transition-colors hover:border-[#4a5058] hover:text-[#e8eaed]"
            >
              사진 고르기
            </button>
          )}
          {cs.type === "video" && (
            <button
              type="button"
              onClick={() => onPickMedia(`customSections.${id}.content.video`)}
              className="mt-1 w-full rounded-md border border-[#2a2e34] py-1.5 text-[12px] text-[#9aa1ab] transition-colors hover:border-[#4a5058] hover:text-[#e8eaed]"
            >
              영상 고르기
            </button>
          )}
          {cs.type === "gallery" && (
            <button
              type="button"
              onClick={() =>
                onPickMedia(`customSections.${id}.content.images.${(cs.content.images ?? []).length}`)
              }
              className="mt-1 w-full rounded-md border border-[#2a2e34] py-1.5 text-[12px] text-[#9aa1ab] transition-colors hover:border-[#4a5058] hover:text-[#e8eaed]"
            >
              사진 추가 ({(cs.content.images ?? []).length}장)
            </button>
          )}
          {cs.type === "spacer" && (
            <Row label="높이">
              <NumberSlider
                value={String(cs.content.height ?? "60px")}
                onChange={(v) => setValue(`customSections.${id}.content.height`, v)}
                min={10}
                max={300}
              />
            </Row>
          )}
        </Group>
      )}

      <Group title="배경 · 여백">
        <DeviceNote />
        <Row label="배경색"><ColorInput value={S("backgroundColor")} onChange={setS("backgroundColor")} /></Row>
        <SpacingBox
          top={S("paddingTop")}
          bottom={S("paddingBottom")}
          onTop={setS("paddingTop")}
          onBottom={setS("paddingBottom")}
        />
        {(id === "hero" || cs?.type === "video" || cs?.type === "banner") && (
          <Row label="높이"><NumberSlider value={S("height")} onChange={setS("height")} min={200} max={900} /></Row>
        )}
      </Group>
    </>
  );
}
