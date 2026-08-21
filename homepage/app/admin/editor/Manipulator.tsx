"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* 캔버스 위에서 사진·영상을 마우스로 직접 다루는 층.
   - 가장자리 8개 손잡이로 크기 조절 (모서리는 비율 유지)
   - 잘라내기(Crop) 모드에서 안쪽을 끌면 보이는 영역(초점)이 이동
   - 끌 때 가운데·가장자리에 붙는 안내선 표시
   실제 값은 draft 의 style 에 저장되고, 미리보기에 즉시 반영된다. */

export type Rect = { x: number; y: number; w: number; h: number };

export type ManipTarget = {
  kind: "image" | "video";
  path: string;
  rect: Rect;
  natural?: { w: number; h: number };
};

type Guide = { type: "v" | "h"; at: number; label: string };

const HANDLES = [
  { id: "nw", x: 0, y: 0, cur: "nwse-resize" },
  { id: "n", x: 0.5, y: 0, cur: "ns-resize" },
  { id: "ne", x: 1, y: 0, cur: "nesw-resize" },
  { id: "e", x: 1, y: 0.5, cur: "ew-resize" },
  { id: "se", x: 1, y: 1, cur: "nwse-resize" },
  { id: "s", x: 0.5, y: 1, cur: "ns-resize" },
  { id: "sw", x: 0, y: 1, cur: "nesw-resize" },
  { id: "w", x: 0, y: 0.5, cur: "ew-resize" },
] as const;

const SNAP = 6;

export default function Manipulator({
  target,
  canvas,
  cropMode,
  getStyle,
  setStyleMany,
  onCropModeChange,
}: {
  target: ManipTarget | null;
  /** 미리보기(iframe) 영역의 화면상 위치 */
  canvas: Rect | null;
  cropMode: boolean;
  getStyle: (path: string, prop: string) => string;
  setStyleMany: (path: string, props: Record<string, string>) => void;
  onCropModeChange: (v: boolean) => void;
}) {
  const [drag, setDrag] = useState<null | { mode: "resize" | "crop"; handle?: string }>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [live, setLive] = useState<Rect | null>(null);
  const start = useRef<{
    mx: number;
    my: number;
    rect: Rect;
    posX: number;
    posY: number;
    ratio: number;
  } | null>(null);

  const rect = live ?? target?.rect ?? null;

  /* 현재 초점(object-position) 읽기 — 없으면 가운데 */
  const readPos = useCallback(
    (path: string) => {
      const v = getStyle(path, "objectPosition") || "50% 50%";
      const m = v.match(/(-?[\d.]+)%\s+(-?[\d.]+)%/);
      return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 50, y: 50 };
    },
    [getStyle]
  );

  useEffect(() => {
    if (!drag || !target || !canvas) return;

    const onMove = (e: MouseEvent) => {
      const s = start.current;
      if (!s) return;
      const dx = e.clientX - s.mx;
      const dy = e.clientY - s.my;

      if (drag.mode === "crop") {
        // 안쪽을 끌면 보이는 영역이 따라 움직인다 (반대 방향으로 초점 이동)
        const nx = clamp(s.posX - (dx / Math.max(1, s.rect.w)) * 100, 0, 100);
        const ny = clamp(s.posY - (dy / Math.max(1, s.rect.h)) * 100, 0, 100);
        setStyleMany(target.path, {
          objectPosition: `${round(nx)}% ${round(ny)}%`,
          objectFit: getStyle(target.path, "objectFit") || "cover",
        });
        return;
      }

      // 크기 조절
      const h = drag.handle!;
      let w = s.rect.w;
      let ht = s.rect.h;
      if (h.includes("e")) w = s.rect.w + dx;
      if (h.includes("w")) w = s.rect.w - dx;
      if (h.includes("s")) ht = s.rect.h + dy;
      if (h.includes("n")) ht = s.rect.h - dy;

      const corner = h.length === 2;
      // 모서리는 비율 유지(Shift 를 누르면 자유 조절)
      if (corner && !e.shiftKey) {
        ht = w / s.ratio;
      }

      w = Math.max(40, w);
      ht = Math.max(40, ht);

      // 캔버스 기준 안내선 (가운데·좌우 끝)
      const g: Guide[] = [];
      const canvasW = canvas.w;
      const centerDelta = Math.abs(w - canvasW / 2);
      if (centerDelta < SNAP * 2) {
        w = canvasW / 2;
        if (corner && !e.shiftKey) ht = w / s.ratio;
        g.push({ type: "v", at: canvasW / 2, label: "1/2" });
      }
      if (Math.abs(w - canvasW) < SNAP * 2) {
        w = canvasW;
        if (corner && !e.shiftKey) ht = w / s.ratio;
        g.push({ type: "v", at: canvasW, label: "가득" });
      }

      setGuides(g);
      setLive({ x: s.rect.x, y: s.rect.y, w, h: ht });
      setStyleMany(target.path, { width: `${Math.round(w)}px`, height: `${Math.round(ht)}px` });
    };

    const onUp = () => {
      setDrag(null);
      setGuides([]);
      setLive(null);
      start.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag, target, canvas, getStyle, setStyleMany]);

  if (!target || !rect || !canvas) return null;
  // 선택한 요소가 보이는 영역 밖이면 손잡이를 그리지 않는다
  if (rect.y + rect.h < 0 || rect.y > canvas.h) return null;

  const begin = (e: React.MouseEvent, mode: "resize" | "crop", handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = readPos(target.path);
    start.current = {
      mx: e.clientX,
      my: e.clientY,
      rect: target.rect,
      posX: pos.x,
      posY: pos.y,
      ratio: target.rect.w / Math.max(1, target.rect.h),
    };
    setDrag({ mode, handle });
    document.body.style.cursor = mode === "crop" ? "grabbing" : "";
    document.body.style.userSelect = "none";
  };

  const box = {
    left: canvas.x + rect.x,
    top: canvas.y + rect.y,
    width: rect.w,
    height: rect.h,
  };

  return (
    <>
      {/* 안내선 */}
      {guides.map((g, i) => (
        <div
          key={i}
          className="pointer-events-none fixed z-[60]"
          style={
            g.type === "v"
              ? { left: canvas.x + g.at, top: canvas.y, width: 1, height: canvas.h, background: "#22d3ee" }
              : { left: canvas.x, top: canvas.y + g.at, height: 1, width: canvas.w, background: "#22d3ee" }
          }
        />
      ))}

      {/* 선택 상자 + 손잡이 */}
      <div
        className="pointer-events-none fixed z-[61]"
        style={{ ...box, outline: `2px solid ${cropMode ? "#22d3ee" : "#e8261e"}`, outlineOffset: 1 }}
      >
        {/* 잘라내기 모드: 안쪽을 끌어 초점 이동 */}
        {cropMode && (
          <div
            className="pointer-events-auto absolute inset-0 cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => begin(e, "crop")}
            title="사진 안쪽을 끌어 보이는 위치를 조절하세요"
          />
        )}

        {/* 크기 손잡이 */}
        {!cropMode &&
          HANDLES.map((h) => (
            <span
              key={h.id}
              onMouseDown={(e) => begin(e, "resize", h.id)}
              style={{
                left: `calc(${h.x * 100}% - 5px)`,
                top: `calc(${h.y * 100}% - 5px)`,
                cursor: h.cur,
              }}
              className="pointer-events-auto absolute h-[10px] w-[10px] rounded-[2px] border border-white bg-[#e8261e] shadow"
            />
          ))}
      </div>

      {/* 요소 위 작은 도구막대 */}
      <div
        className="fixed z-[62] flex items-center gap-1 rounded-md bg-[#e8261e] px-1.5 py-1 text-[11px] font-bold text-white shadow-lg"
        style={{ left: box.left, top: Math.max(4, box.top - 30) }}
      >
        <span className="px-1">{target.kind === "image" ? "사진" : "영상"}</span>
        <button
          type="button"
          onClick={() => onCropModeChange(!cropMode)}
          className={`rounded px-1.5 py-0.5 transition-colors ${
            cropMode ? "bg-white text-[#e8261e]" : "bg-white/20 hover:bg-white/30"
          }`}
        >
          {cropMode ? "잘라내기 끝내기" : "잘라내기"}
        </button>
        <button
          type="button"
          onClick={() =>
            setStyleMany(target.path, { width: "", height: "", objectPosition: "", objectFit: "" })
          }
          className="rounded bg-white/20 px-1.5 py-0.5 transition-colors hover:bg-white/30"
          title="크기와 위치를 원래대로"
        >
          원래대로
        </button>
      </div>

      {/* 크기 표시 */}
      {drag?.mode === "resize" && (
        <div
          className="pointer-events-none fixed z-[62] rounded bg-black/80 px-2 py-1 text-[11px] font-bold text-white tabular-nums"
          style={{ left: box.left + box.width + 8, top: box.top + box.height - 20 }}
        >
          {Math.round(rect.w)} × {Math.round(rect.h)}
        </div>
      )}
      {cropMode && (
        <div
          className="pointer-events-none fixed z-[62] whitespace-nowrap rounded bg-[#22d3ee] px-2 py-1 text-[11px] font-bold text-black"
          style={{ left: box.left, top: box.top + box.height + 6 }}
        >
          사진 안쪽을 끌어 보이는 부분을 맞추세요
        </div>
      )}
    </>
  );
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
function round(v: number) {
  return Math.round(v * 10) / 10;
}
