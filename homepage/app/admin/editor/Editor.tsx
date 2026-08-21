"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Inspector, { type Selection } from "./Inspector";

/* eslint-disable @typescript-eslint/no-explicit-any */

const MSG = "bnf-editor";

const DEVICES = [
  { id: "desktop", label: "PC", w: 0, icon: "M3 5h18v11H3zM8 20h8" },
  { id: "tablet", label: "태블릿", w: 834, icon: "M5 3h14v18H5zM11 18h2" },
  { id: "mobile", label: "모바일", w: 390, icon: "M7 2h10v20H7zM10 19h4" },
] as const;

type DeviceId = (typeof DEVICES)[number]["id"];

const PAGES = [
  { path: "/", label: "홈 화면", sections: true },
  { path: "/company/greeting", label: "인사말" },
  { path: "/company/history", label: "회사연혁" },
  { path: "/company/business", label: "사업분야" },
  { path: "/company/manufacturing", label: "식품제조" },
  { path: "/company/certification", label: "인증현황" },
  { path: "/company/location", label: "오시는 길" },
  { path: "/products/import", label: "수입 제품" },
  { path: "/products/oil", label: "식용 유지" },
  { path: "/products/frozen", label: "냉동 수산/축산" },
  { path: "/products/hmr-export", label: "HMR(수출용)" },
  { path: "/products/hmr", label: "HMR(내수용)" },
  { path: "/products/sauce", label: "소스/육수" },
  { path: "/products/noodle", label: "면류" },
  { path: "/products/seafood", label: "수산물가공품" },
  { path: "/products/etc", label: "기타 가공품" },
  { path: "/support/oem", label: "OEM 견적" },
  { path: "/support/contact", label: "문의하기" },
];

const SECTION_LABELS: Record<string, string> = {
  hero: "첫 화면(영상)",
  videos: "소개 영상",
  cards: "소개 카드",
  product: "PRODUCT",
  location: "오시는 길",
};

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function getPath(obj: any, path: string) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj: any, path: string, value: any) {
  const keys = path.split(".");
  let cur = obj;
  for (const k of keys.slice(0, -1)) {
    if (cur[k] == null) cur[k] = {};
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
}

export default function Editor({ initial }: { initial: any }) {
  const [draft, setDraftState] = useState<any>(initial);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(JSON.stringify(initial));
  const [sel, setSel] = useState<Selection>(null);
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [device, setDevice] = useState<DeviceId>("desktop");
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "ok" | "err"; msg?: string }>({ kind: "idle" });
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const [page, setPage] = useState("/");

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const history = useRef<string[]>([JSON.stringify(initial)]);
  const hIndex = useRef(0);

  const dirty = JSON.stringify(draft) !== savedSnapshot;

  const layout = useMemo(
    () => ({
      order: draft?.layout?.home?.order ?? ["hero", "videos", "cards", "product", "location"],
      hidden: draft?.layout?.home?.hidden ?? [],
    }),
    [draft]
  );

  /* ── 편집 내용을 미리보기 화면에 전달 ── */
  const push = useCallback((next: any) => {
    iframeRef.current?.contentWindow?.postMessage({ __to: MSG, type: "draft", draft: next }, "*");
  }, []);

  /* ── 변경 기록 (되돌리기용) ── */
  const commit = useCallback(
    (next: any) => {
      setDraftState(next);
      const s = JSON.stringify(next);
      if (history.current[hIndex.current] !== s) {
        history.current = history.current.slice(0, hIndex.current + 1);
        history.current.push(s);
        if (history.current.length > 100) history.current.shift();
        hIndex.current = history.current.length - 1;
      }
      push(next);
    },
    [push]
  );

  const undo = useCallback(() => {
    if (hIndex.current <= 0) return;
    hIndex.current -= 1;
    const v = JSON.parse(history.current[hIndex.current]);
    setDraftState(v);
    push(v);
  }, [push]);

  const redo = useCallback(() => {
    if (hIndex.current >= history.current.length - 1) return;
    hIndex.current += 1;
    const v = JSON.parse(history.current[hIndex.current]);
    setDraftState(v);
    push(v);
  }, [push]);

  /* ── 값 읽기/쓰기 ── */
  const getValue = useCallback((path: string) => getPath(draft, path), [draft]);
  const setValue = useCallback(
    (path: string, v: any) => {
      const next = clone(draft);
      setPath(next, path, v);
      commit(next);
    },
    [draft, commit]
  );

  const getStyle = useCallback(
    (path: string, prop: string) => String(draft?.style?.[path]?.[prop] ?? ""),
    [draft]
  );
  const setStyle = useCallback(
    (path: string, prop: string, v: string) => {
      const next = clone(draft);
      next.style = next.style ?? {};
      next.style[path] = next.style[path] ?? {};
      if (v === "" || v == null) delete next.style[path][prop];
      else next.style[path][prop] = prop === "transform" ? `scale(${parseFloat(v) / 100 || 1})` : v;
      if (Object.keys(next.style[path]).length === 0) delete next.style[path];
      commit(next);
    },
    [draft, commit]
  );

  const setLayout = useCallback(
    (l: { order: string[]; hidden: string[] }) => {
      const next = clone(draft);
      next.layout = next.layout ?? {};
      next.layout.home = l;
      commit(next);
    },
    [draft, commit]
  );

  /* ── 미리보기 화면에서 오는 신호 ── */
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.__src !== MSG) return;
      if (d.type === "ready") {
        push(draft);
      } else if (d.type === "select") {
        setSel({ kind: d.kind, path: d.path, text: d.text, src: d.src, alt: d.alt, label: d.label });
        setRect(d.rect);
      } else if (d.type === "rect") {
        setRect(d.rect);
      } else if (d.type === "edit") {
        setValue(d.path, d.value);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [draft, push, setValue]);

  /* ── 단축키 ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
      if (e.key === "Escape" && preview) setPreviewMode(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  /* ── 저장 안 하고 나가기 경고 ── */
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const setPreviewMode = (on: boolean) => {
    setPreview(on);
    if (on) setSel(null);
    iframeRef.current?.contentWindow?.postMessage({ __to: MSG, type: "preview", on }, "*");
  };

  const save = async () => {
    setStatus({ kind: "busy", msg: "저장 중" });
    try {
      const r = await fetch("/api/admin/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "저장 실패");
      setSavedSnapshot(JSON.stringify(draft));
      setStatus({ kind: "ok", msg: "저장했습니다" });
      setTimeout(() => setStatus({ kind: "idle" }), 2200);
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : String(e) });
    }
  };

  const publish = async () => {
    if (!window.confirm("변경사항을 홈페이지에 게시하시겠습니까?\n\n게시하면 방문자에게 바로 보입니다.")) return;
    setStatus({ kind: "busy", msg: "게시 중" });
    try {
      const r = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "게시 실패");
      setSavedSnapshot(JSON.stringify(draft));
      setStatus({ kind: "ok", msg: "홈페이지에 게시되었습니다" });
      setTimeout(() => setStatus({ kind: "idle" }), 3000);
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : String(e) });
    }
  };

  const startInline = (path: string) => {
    iframeRef.current?.contentWindow?.postMessage({ __to: MSG, type: "startInline", path }, "*");
  };

  /* ── 섹션 드래그 ── */
  const onDrop = (index: number) => {
    if (!dragId) return;
    const order = layout.order.filter((x: string) => x !== dragId);
    const at = Math.max(0, Math.min(order.length, index));
    order.splice(at, 0, dragId);
    setLayout({ ...layout, order });
    setDragId(null);
    setDropIdx(null);
  };

  const deviceW = DEVICES.find((d) => d.id === device)!.w;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#0e1013] text-[#e8eaed]">
      {/* ═══ 상단 툴바 ═══ */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#1f2226] bg-[#121417] px-4">
        <a
          href="/admin"
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] text-[#9aa1ab] transition-colors hover:bg-[#1c1f23] hover:text-[#e8eaed]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          관리자
        </a>
        <span className="h-5 w-px bg-[#26292e]" />
        <select
          value={page}
          onChange={(e) => {
            setPage(e.target.value);
            setSel(null);
            setRect(null);
          }}
          aria-label="편집할 페이지"
          className="rounded-md border border-[#2a2e34] bg-[#15181c] px-2.5 py-1.5 text-[12.5px] font-bold text-[#e8eaed] outline-none focus:border-[#e8261e]"
        >
          {PAGES.map((p) => (
            <option key={p.path} value={p.path}>{p.label}</option>
          ))}
        </select>

        {/* 기기 전환 */}
        <div className="mx-auto flex gap-0.5 rounded-lg bg-[#1a1d21] p-1">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDevice(d.id)}
              title={d.label}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                device === d.id ? "bg-[#2a2e34] text-[#e8eaed]" : "text-[#7b828c] hover:text-[#c8ccd2]"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d={d.icon} />
              </svg>
              {d.label}
            </button>
          ))}
        </div>

        {/* 되돌리기 */}
        <div className="flex gap-0.5">
          <button
            type="button"
            onClick={undo}
            disabled={hIndex.current <= 0}
            title="되돌리기 (Ctrl+Z)"
            className="grid h-8 w-8 place-items-center rounded-md text-[#9aa1ab] transition-colors hover:bg-[#1c1f23] hover:text-[#e8eaed] disabled:opacity-30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8" />
            </svg>
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={hIndex.current >= history.current.length - 1}
            title="다시 실행 (Ctrl+Shift+Z)"
            className="grid h-8 w-8 place-items-center rounded-md text-[#9aa1ab] transition-colors hover:bg-[#1c1f23] hover:text-[#e8eaed] disabled:opacity-30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6M21 13a9 9 0 1 1-3-7.7L21 8" />
            </svg>
          </button>
        </div>

        <span className="h-5 w-px bg-[#26292e]" />

        {status.kind === "ok" && <span className="text-[12.5px] font-bold text-[#4ade80]">✓ {status.msg}</span>}
        {status.kind === "err" && (
          <span className="max-w-[260px] truncate text-[12.5px] font-bold text-[#ff6a5e]" title={status.msg}>
            ✕ {status.msg}
          </span>
        )}
        {status.kind === "idle" && dirty && (
          <span className="text-[12.5px] font-semibold text-[#fbbf24]">저장되지 않은 변경사항</span>
        )}

        <button
          type="button"
          onClick={() => setPreviewMode(!preview)}
          className={`rounded-md px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
            preview ? "bg-[#2a2e34] text-[#e8eaed]" : "text-[#9aa1ab] hover:bg-[#1c1f23] hover:text-[#e8eaed]"
          }`}
        >
          {preview ? "편집으로" : "미리보기"}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={status.kind === "busy" || !dirty}
          className="rounded-md border border-[#2a2e34] px-4 py-1.5 text-[12.5px] font-bold text-[#c8ccd2] transition-colors hover:border-[#4a5058] hover:text-white disabled:opacity-40"
        >
          저장
        </button>
        <button
          type="button"
          onClick={publish}
          disabled={status.kind === "busy"}
          className="rounded-md bg-[#e8261e] px-4 py-1.5 text-[12.5px] font-bold text-white transition-colors hover:bg-[#c41c15] disabled:opacity-50"
        >
          게시
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ═══ 왼쪽 섹션 목록 (드래그로 순서 변경) ═══ */}
        {!preview && page === "/" && (
          <aside className="w-[210px] shrink-0 overflow-y-auto border-r border-[#1f2226] bg-[#121417] py-3">
            <h2 className="px-4 pb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b828c]">섹션</h2>
            <p className="px-4 pb-3 text-[11.5px] leading-relaxed text-[#6b727c]">
              끌어서 순서를 바꾸세요
            </p>

            <div className="px-2">
              {layout.order.map((id: string, i: number) => {
                const hidden = layout.hidden.includes(id);
                const active = sel?.kind === "section" && sel.path === id;
                return (
                  <div key={id}>
                    {dropIdx === i && dragId && <div className="mx-1 my-1 h-[2px] rounded bg-[#e8261e]" />}
                    <div
                      draggable
                      onDragStart={() => setDragId(id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setDropIdx(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        const r = e.currentTarget.getBoundingClientRect();
                        setDropIdx(e.clientY < r.top + r.height / 2 ? i : i + 1);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        onDrop(dropIdx ?? i);
                      }}
                      onClick={() => {
                        setSel({ kind: "section", path: id, label: SECTION_LABELS[id] ?? id });
                        setRect(null);
                        iframeRef.current?.contentWindow?.postMessage({ __to: MSG, type: "scrollTo", section: id }, "*");
                      }}
                      className={`group mb-0.5 flex cursor-grab items-center gap-2 rounded-md px-2.5 py-2.5 text-[12.5px] transition-colors active:cursor-grabbing ${
                        active ? "bg-[#e8261e]/15 text-[#ff8a80]" : "text-[#c8ccd2] hover:bg-[#1c1f23]"
                      } ${dragId === id ? "opacity-40" : ""}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-[#5c636d]">
                        <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
                        <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
                        <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
                      </svg>
                      <span className={`flex-1 truncate ${hidden ? "line-through opacity-50" : ""}`}>
                        {SECTION_LABELS[id] ?? id}
                      </span>
                      <button
                        type="button"
                        title={hidden ? "다시 보이기" : "숨기기"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLayout({
                            ...layout,
                            hidden: hidden ? layout.hidden.filter((x: string) => x !== id) : [...layout.hidden, id],
                          });
                        }}
                        className="shrink-0 text-[#5c636d] opacity-0 transition-opacity hover:text-[#e8eaed] group-hover:opacity-100"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          {hidden ? (
                            <>
                              <path d="M3 3l18 18" />
                              <path d="M10.6 5.1A9 9 0 0 1 21 12a17 17 0 0 1-2.7 3.6M6.6 6.6A17 17 0 0 0 3 12a9 9 0 0 0 12.5 4.2" />
                            </>
                          ) : (
                            <>
                              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                              <circle cx="12" cy="12" r="3" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                    {dropIdx === i + 1 && dragId && i === layout.order.length - 1 && (
                      <div className="mx-1 my-1 h-[2px] rounded bg-[#e8261e]" />
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* ═══ 가운데 미리보기 ═══ */}
        <div className="relative min-w-0 flex-1 overflow-auto bg-[#0e1013] p-6">
          <div
            className="relative mx-auto bg-white shadow-2xl transition-all duration-200"
            style={{ width: deviceW ? deviceW : "100%", maxWidth: "100%", height: "calc(100dvh - 6.5rem)" }}
          >
            <iframe
              ref={iframeRef}
              key={page}
              src={`${page}?__edit=1`}
              title="홈페이지 편집 미리보기"
              className="h-full w-full border-0"
            />

            {/* 선택 표시 + 작은 버튼 */}
            {!preview && rect && sel && sel.kind !== "section" && (
              <div
                className="pointer-events-none absolute z-10"
                style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
              >
                <div className="absolute -top-[26px] left-0 flex items-center gap-1 whitespace-nowrap rounded-md bg-[#e8261e] px-2 py-1 text-[11px] font-bold text-white">
                  {sel.kind === "text" && "글자"}
                  {sel.kind === "button" && "버튼"}
                  {sel.kind === "image" && "사진"}
                  {sel.kind === "video" && "영상"}
                  {(sel.kind === "text" || sel.kind === "button") && (
                    <button
                      type="button"
                      onClick={() => startInline(sel.path)}
                      className="pointer-events-auto ml-1 rounded bg-white/20 px-1.5 py-0.5 hover:bg-white/30"
                    >
                      바로 고치기
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {preview && (
            <p className="mt-3 text-center text-[12px] text-[#7b828c]">
              방문자에게 보이는 모습입니다 · ESC 를 누르면 편집으로 돌아갑니다
            </p>
          )}
        </div>

        {/* ═══ 오른쪽 속성 패널 ═══ */}
        {!preview && (
          <aside className="w-[300px] shrink-0 overflow-y-auto overflow-x-hidden border-l border-[#1f2226] bg-[#121417]">
            <div className="flex h-11 items-center justify-between border-b border-[#1f2226] px-4">
              <h2 className="text-[12px] font-bold text-[#c8ccd2]">
                {sel
                  ? { text: "글자 설정", button: "버튼 설정", image: "사진 설정", video: "영상 설정", section: "섹션 설정" }[sel.kind]
                  : "설정"}
              </h2>
              {sel && (
                <button
                  type="button"
                  onClick={() => {
                    setSel(null);
                    iframeRef.current?.contentWindow?.postMessage({ __to: MSG, type: "deselect" }, "*");
                  }}
                  className="text-[#5c636d] transition-colors hover:text-[#e8eaed]"
                  title="선택 해제"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              )}
            </div>

            <Inspector
              sel={sel}
              draft={draft}
              getValue={getValue}
              setValue={setValue}
              getStyle={getStyle}
              setStyle={setStyle}
              layout={layout}
              setLayout={setLayout}
              onInline={startInline}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
