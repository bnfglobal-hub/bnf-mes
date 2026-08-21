"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Inspector, { type Selection } from "./Inspector";
import Manipulator, { type ManipTarget, type Rect } from "./Manipulator";
import SectionOverlay, { type SectionInfo } from "./SectionOverlay";
import SectionLibrary from "./SectionLibrary";
import MediaLibrary from "./MediaLibrary";
import Toolbar, { type DeviceId } from "./Toolbar";
import { TEMPLATES, newId } from "./templates";
import { clone, getPath, setPath, type MediaItem, type SiteDraft } from "./types";

const MSG = "bnf-editor";
const PAGE = "home";
const BUILTINS = ["hero", "videos", "cards", "product", "location"];

export default function Editor({ initial }: { initial: SiteDraft }) {
  const [draft, setDraftState] = useState<SiteDraft>(initial);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(initial));
  const [publishedSnapshot, setPublishedSnapshot] = useState<string | null>(null);

  const [sel, setSel] = useState<Selection>(null);
  const [selRect, setSelRect] = useState<Rect | null>(null);
  const [selNatural, setSelNatural] = useState<{ w: number; h: number } | undefined>();
  const [cropMode, setCropMode] = useState(false);

  const [device, setDevice] = useState<DeviceId>("desktop");
  const [preview, setPreview] = useState(false);
  const [sections, setSections] = useState<SectionInfo[]>([]);
  const [hoverSection, setHoverSection] = useState<string | null>(null);
  const [canvasRect, setCanvasRect] = useState<Rect | null>(null);

  const [libraryAt, setLibraryAt] = useState<number | null>(null);
  const [mediaFor, setMediaFor] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const [, forceRender] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const frameBoxRef = useRef<HTMLDivElement>(null);
  const history = useRef<string[]>([JSON.stringify(initial)]);
  const hIndex = useRef(0);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const dirty = JSON.stringify(draft) !== savedSnapshot;
  const unpublished = publishedSnapshot !== null && JSON.stringify(draft) !== publishedSnapshot;

  const layout = useMemo(
    () => ({
      order: draft.layout?.[PAGE]?.order ?? BUILTINS,
      hidden: draft.layout?.[PAGE]?.hidden ?? [],
    }),
    [draft]
  );

  const showToast = useCallback((kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const push = useCallback((next: SiteDraft) => {
    iframeRef.current?.contentWindow?.postMessage({ __to: MSG, type: "draft", draft: next }, "*");
  }, []);

  const saveDraft = useCallback(
    async (data: SiteDraft, opts?: { silent?: boolean }) => {
      setSaveState("saving");
      try {
        const r = await fetch("/api/admin/draft", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(data),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "저장 실패");
        setSavedSnapshot(JSON.stringify(data));
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1600);
        if (!opts?.silent) showToast("ok", "저장했습니다");
        return true;
      } catch (e) {
        setSaveState("idle");
        showToast("err", e instanceof Error ? e.message : String(e));
        return false;
      }
    },
    [showToast]
  );

  /** 구조가 바뀌면(섹션 추가·삭제·복제·숨김) 저장 후 캔버스를 다시 그린다 */
  const saveThenReload = useCallback(
    (next: SiteDraft) => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      reloadTimer.current = setTimeout(() => {
        void saveDraft(next, { silent: true }).then((ok) => {
          if (ok) iframeRef.current?.contentWindow?.location.reload();
        });
      }, 80);
    },
    [saveDraft]
  );

  const commit = useCallback(
    (next: SiteDraft, opts?: { structural?: boolean }) => {
      setDraftState(next);
      const s = JSON.stringify(next);
      if (history.current[hIndex.current] !== s) {
        history.current = history.current.slice(0, hIndex.current + 1);
        history.current.push(s);
        if (history.current.length > 60) history.current.shift();
        hIndex.current = history.current.length - 1;
        forceRender((n) => n + 1);
      }
      push(next);

      if (opts?.structural) {
        saveThenReload(next);
      } else {
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        setSaveState("saving");
        autosaveTimer.current = setTimeout(() => void saveDraft(next, { silent: true }), 1200);
      }
    },
    [push, saveDraft, saveThenReload]
  );

  const jumpHistory = useCallback(
    (delta: number) => {
      const t = hIndex.current + delta;
      if (t < 0 || t >= history.current.length) return;
      hIndex.current = t;
      const v = JSON.parse(history.current[t]) as SiteDraft;
      setDraftState(v);
      push(v);
      forceRender((n) => n + 1);
      saveThenReload(v);
    },
    [push, saveThenReload]
  );

  const undo = useCallback(() => jumpHistory(-1), [jumpHistory]);
  const redo = useCallback(() => jumpHistory(1), [jumpHistory]);

  /* ── 값 읽기/쓰기 ── */
  const getValue = useCallback((path: string) => getPath(draft, path), [draft]);
  const setValue = useCallback(
    (path: string, v: unknown) => {
      const next = clone(draft);
      setPath(next as Record<string, unknown>, path, v);
      commit(next);
    },
    [draft, commit]
  );

  const styleKey = device === "desktop" ? "style" : device === "tablet" ? "styleTablet" : "styleMobile";

  const getStyle = useCallback(
    (path: string, prop: string) => {
      const bag = (draft as Record<string, unknown>)[styleKey] as
        | Record<string, Record<string, string>>
        | undefined;
      return String(bag?.[path]?.[prop] ?? "");
    },
    [draft, styleKey]
  );

  const setStyleMany = useCallback(
    (path: string, props: Record<string, string>) => {
      const next = clone(draftRef.current) as Record<string, unknown>;
      const bag = (next[styleKey] ?? {}) as Record<string, Record<string, string>>;
      const cur = { ...(bag[path] ?? {}) };
      for (const [k, v] of Object.entries(props)) {
        if (v === "" || v == null) delete cur[k];
        else cur[k] = k === "transform" ? `scale(${(parseFloat(v) || 100) / 100})` : v;
      }
      if (Object.keys(cur).length === 0) delete bag[path];
      else bag[path] = cur;
      next[styleKey] = bag;
      commit(next as SiteDraft);
    },
    [styleKey, commit]
  );

  const setStyle = useCallback(
    (path: string, prop: string, v: string) => setStyleMany(path, { [prop]: v }),
    [setStyleMany]
  );

  const setLayout = useCallback(
    (l: { order: string[]; hidden: string[] }, structural = false) => {
      const next = clone(draftRef.current);
      next.layout = next.layout ?? {};
      next.layout[PAGE] = l;
      commit(next, { structural });
    },
    [commit]
  );

  /* ── 섹션 조작 ── */
  const moveSection = useCallback(
    (id: string, dir: -1 | 1) => {
      const order = [...layout.order];
      const i = order.indexOf(id);
      const t = i + dir;
      if (i < 0 || t < 0 || t >= order.length) return;
      [order[i], order[t]] = [order[t], order[i]];
      setLayout({ ...layout, order });
    },
    [layout, setLayout]
  );

  const toggleHide = useCallback(
    (id: string) => {
      const hidden = layout.hidden.includes(id)
        ? layout.hidden.filter((x) => x !== id)
        : [...layout.hidden, id];
      setLayout({ ...layout, hidden }, true);
    },
    [layout, setLayout]
  );

  const addSection = (templateKey: string, index: number) => {
    const t = TEMPLATES.find((x) => x.key === templateKey);
    if (!t) return;
    const id = newId();
    const next = clone(draftRef.current);
    next.customSections = next.customSections ?? {};
    next.customSections[id] = {
      id,
      type: t.type as never,
      label: t.name,
      content: clone(t.content) as never,
    };
    const order = [...layout.order];
    order.splice(Math.max(0, Math.min(order.length, index)), 0, id);
    next.layout = next.layout ?? {};
    next.layout[PAGE] = { order, hidden: layout.hidden };
    commit(next, { structural: true });
    setLibraryAt(null);
    showToast("ok", `‘${t.name}’ 섹션을 추가했습니다`);
  };

  const duplicateSection = useCallback(
    (id: string) => {
      const src = draftRef.current.customSections?.[id];
      if (!src) {
        showToast("err", "기본 섹션은 복제할 수 없습니다 (숨기기를 쓰세요)");
        return;
      }
      const nid = newId();
      const next = clone(draftRef.current);
      next.customSections![nid] = { ...clone(src), id: nid };
      const order = [...layout.order];
      order.splice(order.indexOf(id) + 1, 0, nid);
      next.layout = next.layout ?? {};
      next.layout[PAGE] = { order, hidden: layout.hidden };
      commit(next, { structural: true });
      showToast("ok", "섹션을 복제했습니다");
    },
    [layout, commit, showToast]
  );

  const deleteSection = useCallback(
    (id: string) => {
      if (!draftRef.current.customSections?.[id]) {
        showToast("err", "기본 섹션은 삭제 대신 숨기기를 쓰세요");
        return;
      }
      if (!window.confirm("이 섹션을 삭제할까요?\n\n되돌리기(Ctrl+Z)로 복구할 수 있습니다.")) return;
      const next = clone(draftRef.current);
      delete next.customSections![id];
      next.layout = next.layout ?? {};
      next.layout[PAGE] = { order: layout.order.filter((x) => x !== id), hidden: layout.hidden };
      commit(next, { structural: true });
      setSel(null);
      showToast("ok", "섹션을 삭제했습니다");
    },
    [layout, commit, showToast]
  );

  const dropSection = useCallback(() => {
    if (!dragId || dropIdx === null) {
      setDragId(null);
      setDropIdx(null);
      return;
    }
    const order = layout.order.filter((x) => x !== dragId);
    const at = Math.max(0, Math.min(order.length, dropIdx > layout.order.indexOf(dragId) ? dropIdx - 1 : dropIdx));
    order.splice(at, 0, dragId);
    setLayout({ ...layout, order });
    setDragId(null);
    setDropIdx(null);
  }, [dragId, dropIdx, layout, setLayout]);

  /* ── 캔버스 위치 추적 ── */
  useEffect(() => {
    const update = () => {
      const el = frameBoxRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setCanvasRect((prev) =>
        prev && prev.x === r.left && prev.y === r.top && prev.w === r.width && prev.h === r.height
          ? prev
          : { x: r.left, y: r.top, w: r.width, h: r.height }
      );
    };
    update();
    window.addEventListener("resize", update);
    const t = setInterval(update, 400);
    return () => {
      window.removeEventListener("resize", update);
      clearInterval(t);
    };
  }, [device, preview]);

  /* ── 미리보기 화면에서 오는 신호 ── */
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.__src !== MSG) return;
      if (d.type === "ready") {
        push(draftRef.current);
      } else if (d.type === "select") {
        setSel({ kind: d.kind, path: d.path, text: d.text, src: d.src, alt: d.alt, label: d.label });
        setSelRect(d.rect);
        setSelNatural(d.natural);
        setCropMode(false);
      } else if (d.type === "rect") {
        setSelRect(d.rect);
      } else if (d.type === "sections") {
        setSections(d.list);
      } else if (d.type === "edit") {
        setValue(d.path, d.value);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [push, setValue]);

  const setPreviewMode = useCallback((on: boolean) => {
    setPreview(on);
    if (on) {
      setSel(null);
      setCropMode(false);
    }
    iframeRef.current?.contentWindow?.postMessage({ __to: MSG, type: "preview", on }, "*");
  }, []);

  /* ── 단축키 ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveDraft(draftRef.current);
        return;
      }
      if (typing) return;

      if (mod && e.key.toLowerCase() === "d" && sel?.kind === "section") {
        e.preventDefault();
        duplicateSection(sel.path);
        return;
      }
      if (e.key === "Escape") {
        if (preview) setPreviewMode(false);
        else if (cropMode) setCropMode(false);
        else {
          setSel(null);
          iframeRef.current?.contentWindow?.postMessage({ __to: MSG, type: "deselect" }, "*");
        }
      }
      if (e.key === "Delete" && sel?.kind === "section") deleteSection(sel.path);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [undo, redo, saveDraft, sel, preview, cropMode, duplicateSection, deleteSection, setPreviewMode]);

  /* ── 저장 안 하고 나가기 경고 ── */
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  /* ── 게시본과 비교 ── */
  useEffect(() => {
    fetch("/api/admin/draft")
      .then((r) => r.json())
      .then((j) => j.published && setPublishedSnapshot(JSON.stringify(j.published)))
      .catch(() => {});
  }, []);

  const publish = async () => {
    if (!window.confirm("이 변경사항을 실제 홈페이지에 반영하시겠습니까?")) return;
    try {
      const r = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draftRef.current),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "게시 실패");
      setSavedSnapshot(JSON.stringify(draftRef.current));
      setPublishedSnapshot(JSON.stringify(draftRef.current));
      showToast("ok", "홈페이지에 게시되었습니다");
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : String(e));
    }
  };

  const startInline = (path: string) =>
    iframeRef.current?.contentWindow?.postMessage({ __to: MSG, type: "startInline", path }, "*");
  const selectInCanvas = (path: string) =>
    iframeRef.current?.contentWindow?.postMessage({ __to: MSG, type: "selectPath", path }, "*");

  const manipTarget: ManipTarget | null =
    !preview && sel && (sel.kind === "image" || sel.kind === "video") && selRect
      ? { kind: sel.kind, path: sel.path, rect: selRect, natural: selNatural }
      : null;

  const deviceW = device === "desktop" ? 0 : device === "tablet" ? 834 : 390;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#0e1013] text-[#e8eaed]">
      <Toolbar
        device={device}
        onDevice={setDevice}
        preview={preview}
        onPreview={setPreviewMode}
        canUndo={hIndex.current > 0}
        canRedo={hIndex.current < history.current.length - 1}
        onUndo={undo}
        onRedo={redo}
        onSave={() => void saveDraft(draftRef.current)}
        onPublish={publish}
        saveState={saveState}
        dirty={dirty}
        unpublished={unpublished}
        onOpenMedia={() => setMediaFor("__browse__")}
      />

      <div className="flex min-h-0 flex-1">
        {/* 왼쪽 — 섹션 */}
        {!preview && (
          <aside className="flex w-[212px] shrink-0 flex-col border-r border-[#1f2226] bg-[#121417]">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b828c]">섹션</h2>
              <button
                type="button"
                onClick={() => setLibraryAt(layout.order.length)}
                title="섹션 추가"
                className="grid h-6 w-6 place-items-center rounded text-[#9aa1ab] transition-colors hover:bg-[#22262b] hover:text-[#e8eaed]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
              {layout.order.map((id, i) => {
                const info = sections.find((s) => s.id === id);
                const label = info?.label ?? draft.customSections?.[id]?.label ?? id;
                const hidden = layout.hidden.includes(id);
                const active = sel?.kind === "section" && sel.path === id;
                const isCustom = !!draft.customSections?.[id];
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
                        dropSection();
                      }}
                      onClick={() => {
                        setSel({ kind: "section", path: id, label });
                        setSelRect(null);
                        selectInCanvas(id);
                      }}
                      className={`group mb-0.5 flex cursor-grab items-center gap-2 rounded-md px-2.5 py-2.5 text-[12.5px] transition-colors active:cursor-grabbing ${
                        active ? "bg-[#e8261e]/15 text-[#ff8a80]" : "text-[#c8ccd2] hover:bg-[#1c1f23]"
                      } ${dragId === id ? "opacity-40" : ""}`}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-[#5c636d]">
                        <circle cx="9" cy="5" r="1.8" /><circle cx="15" cy="5" r="1.8" />
                        <circle cx="9" cy="12" r="1.8" /><circle cx="15" cy="12" r="1.8" />
                        <circle cx="9" cy="19" r="1.8" /><circle cx="15" cy="19" r="1.8" />
                      </svg>
                      <span className={`flex-1 truncate ${hidden ? "line-through opacity-50" : ""}`}>{label}</span>
                      {isCustom && <span className="shrink-0 text-[9.5px] text-[#5c636d]">추가</span>}
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

        {/* 가운데 — 캔버스 */}
        <div className="relative min-w-0 flex-1 overflow-hidden bg-[#0e1013] p-6">
          <div
            ref={frameBoxRef}
            className="relative mx-auto bg-white shadow-2xl transition-all duration-200"
            style={{ width: deviceW || "100%", maxWidth: "100%", height: "calc(100dvh - 6.5rem)" }}
          >
            <iframe
              ref={iframeRef}
              src="/admin/preview?__edit=1"
              title="홈페이지 편집 미리보기"
              className="h-full w-full border-0"
            />
          </div>
          {preview && (
            <p className="mt-3 text-center text-[12px] text-[#7b828c]">
              방문자에게 보이는 모습입니다 · ESC 로 편집으로 돌아갑니다
            </p>
          )}
        </div>

        {/* 오른쪽 — 설정 */}
        {!preview && (
          <aside className="w-[300px] shrink-0 overflow-y-auto overflow-x-hidden border-l border-[#1f2226] bg-[#121417]">
            <div className="flex h-11 items-center justify-between border-b border-[#1f2226] px-4">
              <h2 className="text-[12px] font-bold text-[#c8ccd2]">
                {sel
                  ? { text: "글자 설정", button: "버튼 설정", image: "사진 설정", video: "영상 설정", section: "섹션 설정" }[sel.kind]
                  : "설정"}
              </h2>
              <div className="flex items-center gap-1.5">
                {device !== "desktop" && (
                  <span className="rounded bg-[#2a2e34] px-1.5 py-0.5 text-[10px] font-bold text-[#9aa1ab]">
                    {device === "tablet" ? "태블릿 전용" : "모바일 전용"}
                  </span>
                )}
                {sel && (
                  <button
                    type="button"
                    onClick={() => {
                      setSel(null);
                      iframeRef.current?.contentWindow?.postMessage({ __to: MSG, type: "deselect" }, "*");
                    }}
                    className="text-[#5c636d] transition-colors hover:text-[#e8eaed]"
                    title="선택 해제 (ESC)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <Inspector
              sel={sel}
              draft={draft}
              device={device}
              getValue={getValue}
              setValue={setValue}
              getStyle={getStyle}
              setStyle={setStyle}
              layout={layout}
              setLayout={setLayout}
              onInline={startInline}
              onPickMedia={(path) => setMediaFor(path)}
              onDuplicate={duplicateSection}
              onDelete={deleteSection}
              isCustom={!!(sel && draft.customSections?.[sel.path])}
            />
          </aside>
        )}
      </div>

      {/* 캔버스 위 겹침 층 */}
      {!preview && canvasRect && (
        <>
          <SectionOverlay
            sections={sections}
            canvas={canvasRect}
            hoverId={hoverSection}
            selectedId={sel?.kind === "section" ? sel.path : null}
            hiddenIds={layout.hidden}
            onHover={setHoverSection}
            onSelect={(id) => {
              setSel({ kind: "section", path: id, label: sections.find((s) => s.id === id)?.label ?? id });
              setSelRect(null);
            }}
            onMove={moveSection}
            onDuplicate={duplicateSection}
            onToggleHide={toggleHide}
            onDelete={deleteSection}
            onAddAt={(i) => setLibraryAt(i)}
            dragId={dragId}
            onDragStart={setDragId}
            onDragOver={setDropIdx}
            onDrop={dropSection}
          />

          <Manipulator
            target={manipTarget}
            canvas={canvasRect}
            cropMode={cropMode}
            getStyle={getStyle}
            setStyleMany={setStyleMany}
            onCropModeChange={setCropMode}
          />

          {sel && (sel.kind === "text" || sel.kind === "button") && selRect &&
            selRect.y > -selRect.h && selRect.y < canvasRect.h && (
            <div
              className="fixed z-[62] flex items-center gap-1 rounded-md bg-[#e8261e] px-1.5 py-1 text-[11px] font-bold text-white shadow-lg"
              style={{
                left: canvasRect.x + selRect.x,
                top: Math.max(canvasRect.y + 4, canvasRect.y + selRect.y - 30),
              }}
            >
              <span className="px-1">{sel.kind === "text" ? "글자" : "버튼"}</span>
              <button
                type="button"
                onClick={() => startInline(sel.path)}
                className="rounded bg-white/20 px-1.5 py-0.5 hover:bg-white/30"
              >
                바로 고치기
              </button>
            </div>
          )}
        </>
      )}

      {libraryAt !== null && (
        <SectionLibrary onPick={(key) => addSection(key, libraryAt)} onClose={() => setLibraryAt(null)} />
      )}

      {mediaFor && (
        <MediaLibrary
          media={(draft.media ?? []) as MediaItem[]}
          onAddMedia={(items) => {
            const next = clone(draftRef.current);
            const seen = new Set(items.map((i) => i.url));
            next.media = [...items, ...((next.media ?? []) as MediaItem[]).filter((m) => !seen.has(m.url))].slice(0, 300);
            commit(next);
          }}
          onPick={(url) => {
            if (mediaFor !== "__browse__") setValue(mediaFor, url);
            setMediaFor(null);
          }}
          onClose={() => setMediaFor(null)}
          browseOnly={mediaFor === "__browse__"}
        />
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-lg px-5 py-3 text-[13px] font-bold shadow-2xl ${
            toast.kind === "ok" ? "bg-[#15803d] text-white" : "bg-[#c41c15] text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
