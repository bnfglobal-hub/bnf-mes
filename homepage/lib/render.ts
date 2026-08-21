import type { CustomSectionData } from "@/app/(site)/sections/CustomSection";

/** 홈페이지 렌더러가 쓰는 도우미 묶음.
 *  방문자 화면은 게시본(site.json)으로, 편집기 캔버스는 작업본(site.draft.json)으로
 *  같은 컴포넌트를 그린다 — 그래서 편집 화면과 실제 화면이 어긋나지 않는다. */

export type SiteData = Record<string, unknown>;

export type Helpers = {
  data: SiteData;
  company: Record<string, never> | Record<string, unknown>;
  lines: (t: string) => string[];
  paragraphs: (t: string) => string[];
  sectionOrder: (page: string, builtins: string[]) => string[];
  isHidden: (page: string, section: string) => boolean;
  customSection: (id: string) => CustomSectionData | null;
  styleOf: (path: string) => React.CSSProperties | undefined;
  get: <T = unknown>(path: string, fallback?: T) => T;
};

function kebab(k: string) {
  return k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

function pick(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => {
    if (o == null) return undefined;
    return (o as Record<string, unknown>)[k];
  }, obj);
}

export function makeHelpers(data: SiteData): Helpers {
  const layout = (data.layout ?? {}) as Record<string, { order?: string[]; hidden?: string[] }>;
  const custom = (data.customSections ?? {}) as Record<string, CustomSectionData>;
  const style = (data.style ?? {}) as Record<string, Record<string, string>>;
  const styleTablet = (data.styleTablet ?? {}) as Record<string, Record<string, string>>;
  const styleMobile = (data.styleMobile ?? {}) as Record<string, Record<string, string>>;

  return {
    data,
    company: (data.company ?? {}) as Record<string, unknown>,

    lines: (t) => String(t ?? "").split("\n"),
    paragraphs: (t) =>
      String(t ?? "")
        .split(/\n{2,}/)
        .map((s) => s.trim())
        .filter(Boolean),

    sectionOrder(page, builtins) {
      const customIds = Object.keys(custom);
      const known = new Set([...builtins, ...customIds]);
      const saved = layout[page]?.order;
      if (!Array.isArray(saved) || saved.length === 0) return [...builtins, ...customIds];
      const kept = saved.filter((s) => known.has(s));
      const extra = [...builtins, ...customIds].filter((s) => !kept.includes(s));
      return [...kept, ...extra];
    },

    isHidden: (page, section) => (layout[page]?.hidden ?? []).includes(section),

    customSection: (id) => custom[id] ?? null,

    styleOf(path) {
      const base = style[path];
      const tab = styleTablet[path];
      const mob = styleMobile[path];
      if (!base && !tab && !mob) return undefined;
      const out: Record<string, string> = {};
      if (base) for (const [k, v] of Object.entries(base)) if (v) out[k] = v;
      if (tab) for (const [k, v] of Object.entries(tab)) if (v) out[`--t-${kebab(k)}`] = v;
      if (mob) for (const [k, v] of Object.entries(mob)) if (v) out[`--m-${kebab(k)}`] = v;
      return out as React.CSSProperties;
    },

    get: <T,>(path: string, fallback?: T) => (pick(data, path) as T) ?? (fallback as T),
  };
}
