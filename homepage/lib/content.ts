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

/** 해당 페이지의 섹션 순서. 저장된 값이 없으면 기본 순서를 쓴다. */
export function sectionOrder(page: string, fallback: string[] = DEFAULT_HOME_ORDER): string[] {
  const saved = layoutRaw[page]?.order;
  if (!Array.isArray(saved) || saved.length === 0) return fallback;
  // 저장된 순서에 없는 섹션(코드에 새로 생긴 것)은 뒤에 붙인다
  const extra = fallback.filter((s) => !saved.includes(s));
  return [...saved.filter((s) => fallback.includes(s)), ...extra];
}

/** 관리자가 숨긴 섹션인지 */
export function isHidden(page: string, section: string): boolean {
  return (layoutRaw[page]?.hidden ?? []).includes(section);
}

/* ───────── 요소별 스타일 덮어쓰기 ─────────
   관리자가 손대지 않은 요소는 빈 객체를 돌려주므로 기존 디자인이 그대로 유지된다. */

export type StyleOverride = {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  letterSpacing?: string;
  lineHeight?: string;
  textAlign?: string;
  color?: string;
  backgroundColor?: string;
  paddingTop?: string;
  paddingBottom?: string;
  objectFit?: string;
  objectPosition?: string;
  opacity?: string;
  [k: string]: string | undefined;
};

const styleRaw = ((raw as unknown as { style?: Record<string, StyleOverride> }).style ??
  {}) as Record<string, StyleOverride>;

/** content 경로에 저장된 스타일 덮어쓰기 값 (없으면 undefined) */
export function styleOf(path: string): React.CSSProperties | undefined {
  const s = styleRaw[path];
  if (!s || Object.keys(s).length === 0) return undefined;
  return s as React.CSSProperties;
}
