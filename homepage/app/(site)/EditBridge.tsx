"use client";

/* 비주얼 편집기 ↔ 실제 홈페이지 사이의 다리.
   편집 모드(?__edit=1)에서만 불러온다. 일반 방문자에게는 이 파일이 내려가지 않는다.

   하는 일
   - 편집 가능한 요소에 마우스를 올리면 테두리, 클릭하면 선택 → 부모(편집기)에 알림
   - 부모가 보낸 작업본(draft)을 화면에 그대로 반영 (글자·사진·영상·스타일·섹션 순서/숨김)
   - 글자는 화면에서 바로 입력(contenteditable)
*/

import { useEffect } from "react";

type Kind = "text" | "image" | "video" | "button" | "section";

const MSG = "bnf-editor";

function post(type: string, payload: Record<string, unknown> = {}) {
  window.parent?.postMessage({ __src: MSG, type, ...payload }, "*");
}

/** content 경로로 값 읽기 (a.b.0.c) */
function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => {
    if (o == null) return undefined;
    return (o as Record<string, unknown>)[k];
  }, obj);
}

function rectOf(el: Element) {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

/** 선택된 요소를 알아보기 위한 키 */
function keyOf(el: HTMLElement): { kind: Kind; path: string } | null {
  if (el.dataset.section) return { kind: "section", path: el.dataset.section };
  if (el.dataset.video) return { kind: "video", path: el.dataset.video };
  if (el.dataset.img) return { kind: "image", path: el.dataset.img };
  if (el.dataset.btn && el.dataset.edit) return { kind: "button", path: el.dataset.edit };
  if (el.dataset.btn) return { kind: "button", path: el.dataset.btn };
  if (el.dataset.edit) return { kind: "text", path: el.dataset.edit };
  return null;
}

function closestEditable(target: EventTarget | null): HTMLElement | null {
  let el = target as HTMLElement | null;
  while (el && el !== document.body) {
    if (el.dataset && (el.dataset.edit || el.dataset.img || el.dataset.video || el.dataset.btn)) return el;
    el = el.parentElement;
  }
  return null;
}

function closestSection(target: EventTarget | null): HTMLElement | null {
  let el = target as HTMLElement | null;
  while (el && el !== document.body) {
    if (el.dataset && el.dataset.section) return el;
    el = el.parentElement;
  }
  return null;
}

export default function EditBridge() {
  useEffect(() => {
    document.documentElement.dataset.editing = "1";

    let selected: HTMLElement | null = null;
    let editingEl: HTMLElement | null = null;
    let previewOnly = false;

    /* ── 화면 위 표시용 스타일 ── */
    const style = document.createElement("style");
    style.textContent = `
      [data-editing="1"] [data-edit], [data-editing="1"] [data-img],
      [data-editing="1"] [data-video], [data-editing="1"] [data-btn] { cursor: default; }
      .bnf-hover { outline: 1.5px dashed rgba(232,38,30,.55) !important; outline-offset: 2px; }
      .bnf-sel { outline: 2px solid #e8261e !important; outline-offset: 2px; }
      .bnf-sec-hover { outline: 1.5px dashed rgba(232,38,30,.35) !important; outline-offset: -2px; }
      .bnf-editing { outline: 2px solid #e8261e !important; outline-offset: 2px; background: rgba(232,38,30,.04); }
      [data-editing="1"] iframe { pointer-events: none; }
      .bnf-preview [data-edit], .bnf-preview [data-img],
      .bnf-preview [data-video], .bnf-preview [data-btn] { outline: none !important; }
      .bnf-preview a, .bnf-preview iframe { pointer-events: auto !important; }
    `;
    document.head.appendChild(style);

    /* ── 마우스 올림 ── */
    const onOver = (e: MouseEvent) => {
      if (previewOnly || editingEl) return;
      document.querySelectorAll(".bnf-hover,.bnf-sec-hover").forEach((n) => {
        n.classList.remove("bnf-hover", "bnf-sec-hover");
      });
      const el = closestEditable(e.target);
      if (el) {
        el.classList.add("bnf-hover");
        return;
      }
      const sec = closestSection(e.target);
      if (sec) sec.classList.add("bnf-sec-hover");
    };

    /* ── 클릭 → 선택 (편집 중에는 링크 이동을 막는다) ── */
    const onClick = (e: MouseEvent) => {
      if (previewOnly) return;
      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (anchor) e.preventDefault();
      const el = closestEditable(e.target) ?? closestSection(e.target);
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      select(el);
    };

    function select(el: HTMLElement) {
      if (selected) selected.classList.remove("bnf-sel");
      selected = el;
      el.classList.add("bnf-sel");
      const k = keyOf(el);
      if (!k) return;

      const extra: Record<string, unknown> = {};
      if (k.kind === "image") {
        const img = el as HTMLImageElement;
        extra.src = img.getAttribute("src");
        extra.alt = img.alt;
      }
      if (k.kind === "video") {
        extra.src = (el as HTMLVideoElement).getAttribute("src");
      }
      if (k.kind === "text" || k.kind === "button") {
        extra.text = el.innerText;
      }
      if (k.kind === "section") {
        extra.label = el.dataset.sectionLabel ?? k.path;
      }

      post("select", { kind: k.kind, path: k.path, rect: rectOf(el), ...extra });
    }

    /* ── 인라인 글자 편집 ── */
    function startInline(path: string) {
      const el = document.querySelector<HTMLElement>(`[data-edit="${CSS.escape(path)}"]`);
      if (!el) return;
      editingEl = el;
      el.classList.add("bnf-editing");
      el.setAttribute("contenteditable", "plaintext-only");
      el.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel?.removeAllRanges();
      sel?.addRange(range);

      const finish = () => {
        if (!editingEl) return;
        const value = editingEl.innerText.replace(/ /g, " ").replace(/\n{3,}/g, "\n\n");
        editingEl.removeAttribute("contenteditable");
        editingEl.classList.remove("bnf-editing");
        post("edit", { path, value });
        editingEl.removeEventListener("blur", finish);
        editingEl.removeEventListener("keydown", onKey);
        editingEl = null;
      };
      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === "Escape") {
          ev.preventDefault();
          finish();
        }
        const multiline = el.dataset.editMultiline === "1";
        if (ev.key === "Enter" && !multiline) {
          ev.preventDefault();
          finish();
        }
      };
      el.addEventListener("blur", finish);
      el.addEventListener("keydown", onKey);
    }

    /* ── 작업본을 화면에 반영 ── */
    function applyDraft(draft: Record<string, unknown>) {
      // 글자
      document.querySelectorAll<HTMLElement>("[data-edit]").forEach((el) => {
        if (el === editingEl) return;
        const path = el.dataset.edit!;
        const v = getPath(draft, path);
        if (typeof v !== "string") return;
        const format = el.dataset.editFormat;
        const multiline = el.dataset.editMultiline === "1";
        if (format === "paragraphs") {
          // 빈 줄로 나뉜 문단을 <p> 로 다시 그린다 (원래 문단 클래스를 유지)
          const keep = el.querySelector("p")?.className ?? "";
          const parts = v.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
          el.innerHTML = "";
          parts.forEach((t) => {
            const para = document.createElement("p");
            if (keep) para.className = keep;
            para.textContent = t;
            el.appendChild(para);
          });
        } else if (multiline) {
          el.innerHTML = "";
          v.split("\n").forEach((line) => {
            const span = document.createElement("span");
            span.className = "block";
            span.textContent = line;
            el.appendChild(span);
          });
        } else if (el.innerText !== v) {
          el.textContent = v;
        }
      });

      // 사진
      document.querySelectorAll<HTMLImageElement>("[data-img]").forEach((el) => {
        const v = getPath(draft, el.dataset.img!);
        if (typeof v === "string" && el.getAttribute("src") !== v) el.setAttribute("src", v);
      });

      // 영상
      document.querySelectorAll<HTMLVideoElement>("[data-video]").forEach((el) => {
        const v = getPath(draft, el.dataset.video!);
        if (typeof v === "string" && el.getAttribute("src") !== v) {
          el.setAttribute("src", v);
          el.load?.();
        }
      });

      // 스타일 덮어쓰기
      const styles = (draft.style ?? {}) as Record<string, Record<string, string>>;
      document
        .querySelectorAll<HTMLElement>("[data-edit],[data-img],[data-video],[data-btn]")
        .forEach((el) => {
          const key = el.dataset.edit || el.dataset.img || el.dataset.video || el.dataset.btn;
          if (!key) return;
          const s = styles[key];
          // 이전에 적용했던 것 지우기
          const applied = (el.dataset.bnfStyled || "").split(",").filter(Boolean);
          applied.forEach((prop) => el.style.removeProperty(prop));
          if (!s) {
            delete el.dataset.bnfStyled;
            return;
          }
          const props: string[] = [];
          Object.entries(s).forEach(([k, val]) => {
            if (!val) return;
            const prop = k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
            el.style.setProperty(prop, val, "important");
            props.push(prop);
          });
          el.dataset.bnfStyled = props.join(",");
        });

      // 오버레이 강도
      const ov = (draft as { home?: { heroOverlay?: number } }).home?.heroOverlay;
      const ovEl = document.querySelector<HTMLElement>("[data-overlay]");
      if (ovEl && typeof ov === "number") {
        ovEl.style.background = `rgba(0,0,0,${Math.max(0, Math.min(0.9, ov))})`;
      }

      // 섹션 순서·숨김
      const layout = (draft.layout ?? {}) as Record<string, { order?: string[]; hidden?: string[] }>;
      const home = layout.home;
      if (home) {
        const hidden = new Set(home.hidden ?? []);
        document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => {
          el.style.display = hidden.has(el.dataset.section!) ? "none" : "";
        });
        if (Array.isArray(home.order) && home.order.length) {
          const map = new Map<string, HTMLElement>();
          document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => {
            map.set(el.dataset.section!, el);
          });
          const first = map.values().next().value;
          const parent = first?.parentElement;
          if (parent) {
            home.order.forEach((id) => {
              const el = map.get(id);
              if (el) parent.appendChild(el);
            });
          }
        }
      }

      post("applied", {});
      queueMicrotask(sendRect);
    }

    function sendRect() {
      if (selected && document.contains(selected)) {
        post("rect", { rect: rectOf(selected) });
      }
    }

    function setPreview(on: boolean) {
      previewOnly = on;
      document.body.classList.toggle("bnf-preview", on);
      if (on) {
        document.querySelectorAll(".bnf-hover,.bnf-sel,.bnf-sec-hover").forEach((n) =>
          n.classList.remove("bnf-hover", "bnf-sel", "bnf-sec-hover")
        );
        selected = null;
        document.documentElement.removeAttribute("data-editing");
      } else {
        document.documentElement.dataset.editing = "1";
      }
    }

    /* ── 부모(편집기)에서 오는 명령 ── */
    const onMessage = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.__to !== MSG) return;
      switch (d.type) {
        case "draft":
          applyDraft(d.draft);
          break;
        case "startInline":
          startInline(d.path);
          break;
        case "preview":
          setPreview(!!d.on);
          break;
        case "deselect":
          if (selected) selected.classList.remove("bnf-sel");
          selected = null;
          break;
        case "scrollTo": {
          const el = document.querySelector<HTMLElement>(`[data-section="${CSS.escape(d.section)}"]`);
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
          break;
        }
      }
    };

    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("click", onClick, true);
    window.addEventListener("message", onMessage);
    window.addEventListener("scroll", sendRect, true);
    window.addEventListener("resize", sendRect);

    post("ready", { page: location.pathname });

    return () => {
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("scroll", sendRect, true);
      window.removeEventListener("resize", sendRect);
      style.remove();
      document.documentElement.removeAttribute("data-editing");
    };
  }, []);

  return null;
}
