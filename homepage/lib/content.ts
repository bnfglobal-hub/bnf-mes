import raw from "../content/site.json";

/** 사이트의 모든 글·사진은 content/site.json 한 곳에서 관리한다.
 *  관리자 비주얼 편집기(/admin/editor)에서 고치면 이 파일이 갱신된다. */
export const content = raw;

export type Content = typeof raw;
export type Company = Content["company"];

export const company = raw.company;

/** 줄바꿈(\n)이 들어간 텍스트를 문단 배열로 */
export function paragraphs(text: string): string[] {
  return text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
}

/** 줄바꿈(\n) 한 번은 <br>로 쓰기 위해 줄 배열로 */
export function lines(text: string): string[] {
  return text.split("\n");
}

/* ───────── 섹션 순서·표시 여부 ───────── */

type LayoutMap = Record<string, { order: string[]; hidden: string[] }>;

const DEFAULT_HOME_ORDER = ["hero", "videos", "cards", "product", "location"];

const layoutRaw = (raw as unknown as { layout?: LayoutMap }).layout ?? {};

/** 해당 페이지의 섹션 순서. 코드에 있는 기본 섹션 + 관리자가 추가한 섹션을 함께 다룬다. */
export function sectionOrder(page: string, builtins: string[] = DEFAULT_HOME_ORDER): string[] {
  const saved = layoutRaw[page]?.order;
  const customIds = Object.keys(customSections);
  const known = new Set([...builtins, ...customIds]);
  if (!Array.isArray(saved) || saved.length === 0) return [...builtins, ...customIds];
  const kept = saved.filter((s) => known.has(s));
  // 저장된 순서에 없는 것(코드에 새로 생겼거나 방금 추가된 섹션)은 뒤에 붙인다
  const extra = [...builtins, ...customIds].filter((s) => !kept.includes(s));
  return [...kept, ...extra];
}

/** 관리자가 숨긴 섹션인지 */
export function isHidden(page: string, section: string): boolean {
  return (layoutRaw[page]?.hidden ?? []).includes(section);
}

/* ───────── 관리자가 추가한 섹션 ───────── */

import type { CustomSectionData } from "@/app/(site)/sections/CustomSection";

export const customSections = ((raw as unknown as { customSections?: Record<string, CustomSectionData> })
  .customSections ?? {}) as Record<string, CustomSectionData>;

export function customSection(id: string): CustomSectionData | null {
  return customSections[id] ?? null;
}

/* ───────── 요소별 스타일 덮어쓰기 ─────────
   관리자가 손대지 않은 요소는 아무 값도 돌려주지 않으므로 기존 디자인이 그대로 유지된다.
   태블릿·모바일 전용 값은 CSS 변수로 내려보내고, 미디어쿼리(globals.css)가 적용한다. */

export type StyleOverride = Record<string, string | undefined>;

const styleRaw = ((raw as unknown as { style?: Record<string, StyleOverride> }).style ?? {}) as Record<
  string,
  StyleOverride
>;
const styleTabletRaw = ((raw as unknown as { styleTablet?: Record<string, StyleOverride> }).styleTablet ??
  {}) as Record<string, StyleOverride>;
const styleMobileRaw = ((raw as unknown as { styleMobile?: Record<string, StyleOverride> }).styleMobile ??
  {}) as Record<string, StyleOverride>;

/** 카멜케이스 → CSS 속성명 */
function kebab(k: string) {
  return k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

/** content 경로에 저장된 스타일. 기기별 값이 있으면 CSS 변수로 함께 실어 보낸다. */
export function styleOf(path: string): React.CSSProperties | undefined {
  const base = styleRaw[path];
  const tab = styleTabletRaw[path];
  const mob = styleMobileRaw[path];
  if (!base && !tab && !mob) return undefined;

  const out: Record<string, string> = {};
  if (base) for (const [k, v] of Object.entries(base)) if (v) out[k] = v;
  if (tab) for (const [k, v] of Object.entries(tab)) if (v) out[`--t-${kebab(k)}`] = v;
  if (mob) for (const [k, v] of Object.entries(mob)) if (v) out[`--m-${kebab(k)}`] = v;
  return out as React.CSSProperties;
}
