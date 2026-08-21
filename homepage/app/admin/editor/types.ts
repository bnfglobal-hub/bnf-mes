import type { CustomSectionData } from "@/app/(site)/sections/CustomSection";

/** 편집기가 다루는 사이트 데이터 (content/site.draft.json 과 같은 모양) */
export type StyleBag = Record<string, Record<string, string>>;

export type MediaItem = {
  url: string;
  name: string;
  type: "image" | "video";
  size?: number;
  at?: string;
};

export type SiteDraft = {
  layout?: Record<string, { order: string[]; hidden: string[] }>;
  style?: StyleBag;
  styleTablet?: StyleBag;
  styleMobile?: StyleBag;
  customSections?: Record<string, CustomSectionData>;
  media?: MediaItem[];
  seo?: Record<string, Record<string, string>>;
  [key: string]: unknown;
};

export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => {
    if (o == null) return undefined;
    return (o as Record<string, unknown>)[k];
  }, obj);
}

export function setPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let cur: Record<string, unknown> = obj;
  for (const k of keys.slice(0, -1)) {
    if (cur[k] == null || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
}
