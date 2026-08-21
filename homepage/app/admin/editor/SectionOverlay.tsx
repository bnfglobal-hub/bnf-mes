"use client";

import type { Rect } from "./Manipulator";

/** 캔버스 위에 그리는 섹션 도구막대와 '+ 섹션 추가' 버튼.
 *  마우스를 올린 섹션에만 나타나 화면을 가리지 않는다. */

export type SectionInfo = { id: string; label: string; custom: boolean; rect: Rect };

export default function SectionOverlay({
  sections,
  canvas,
  hoverId,
  selectedId,
  hiddenIds,
  onHover,
  onSelect,
  onMove,
  onDuplicate,
  onToggleHide,
  onDelete,
  onAddAt,
  dragId,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  sections: SectionInfo[];
  canvas: Rect;
  hoverId: string | null;
  selectedId: string | null;
  hiddenIds: string[];
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDuplicate: (id: string) => void;
  onToggleHide: (id: string) => void;
  onDelete: (id: string) => void;
  onAddAt: (index: number) => void;
  dragId: string | null;
  onDragStart: (id: string) => void;
  onDragOver: (index: number) => void;
  onDrop: () => void;
}) {
  return (
    <>
      {sections.map((s, i) => {
        const top = canvas.y + s.rect.y;
        const left = canvas.x + s.rect.x;
        const active = hoverId === s.id || selectedId === s.id;
        const hidden = hiddenIds.includes(s.id);
        // 캔버스 밖으로 벗어난 섹션은 그리지 않는다
        if (top + s.rect.h < canvas.y - 40 || top > canvas.y + canvas.h + 40) return null;

        return (
          <div key={s.id}>
            {/* 섹션 감지 영역 (테두리 + hover) */}
            <div
              onMouseEnter={() => onHover(s.id)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(s.id)}
              className="fixed z-[40]"
              style={{
                left,
                top: Math.max(canvas.y, top),
                width: s.rect.w,
                height: Math.min(s.rect.h, canvas.y + canvas.h - Math.max(canvas.y, top)),
                pointerEvents: "none",
                outline: active ? "2px solid rgba(232,38,30,.5)" : "none",
                outlineOffset: -2,
                background: hidden ? "repeating-linear-gradient(45deg,rgba(0,0,0,.04) 0 8px,transparent 8px 16px)" : "none",
              }}
            />

            {/* 도구막대 — 마우스를 올렸을 때만 */}
            {active && top > canvas.y - 20 && (
              <div
                onMouseEnter={() => onHover(s.id)}
                onMouseLeave={() => onHover(null)}
                className="fixed z-[45] flex items-center gap-0.5 rounded-md border border-[#2a2e34] bg-[#15181c] px-1 py-1 shadow-lg"
                style={{ left: left + 10, top: Math.max(canvas.y + 4, top + 8) }}
              >
                <span
                  draggable
                  onDragStart={() => onDragStart(s.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    onDragOver(i);
                  }}
                  onDrop={onDrop}
                  title="끌어서 순서 변경"
                  className="cursor-grab px-1.5 text-[#7b828c] active:cursor-grabbing"
                >
                  <svg width="11" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="5" r="1.8" /><circle cx="15" cy="5" r="1.8" />
                    <circle cx="9" cy="12" r="1.8" /><circle cx="15" cy="12" r="1.8" />
                    <circle cx="9" cy="19" r="1.8" /><circle cx="15" cy="19" r="1.8" />
                  </svg>
                </span>
                <span className="max-w-[120px] truncate px-1 text-[11.5px] font-bold text-[#e8eaed]">
                  {s.label}
                </span>
                <Btn title="위로" onClick={() => onMove(s.id, -1)} d="M12 19V5M5 12l7-7 7 7" />
                <Btn title="아래로" onClick={() => onMove(s.id, 1)} d="M12 5v14M19 12l-7 7-7-7" />
                {s.custom && (
                  <Btn
                    title="복제"
                    onClick={() => onDuplicate(s.id)}
                    d="M8 8h11v11H8zM5 16V5h11"
                  />
                )}
                <Btn
                  title={hidden ? "다시 보이기" : "숨기기"}
                  onClick={() => onToggleHide(s.id)}
                  d={hidden ? "M3 3l18 18M10.6 5.1A9 9 0 0 1 21 12M6.6 6.6A17 17 0 0 0 3 12a9 9 0 0 0 12.5 4.2" : "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"}
                />
                {s.custom && (
                  <Btn title="삭제" danger onClick={() => onDelete(s.id)} d="M6 6l12 12M18 6L6 18" />
                )}
              </div>
            )}

            {/* 섹션 사이 '+ 섹션 추가' */}
            <AddLine
              y={Math.max(canvas.y, top + s.rect.h)}
              left={left}
              width={s.rect.w}
              canvas={canvas}
              onClick={() => onAddAt(i + 1)}
              highlight={dragId !== null}
            />
            {i === 0 && (
              <AddLine
                y={Math.max(canvas.y, top)}
                left={left}
                width={s.rect.w}
                canvas={canvas}
                onClick={() => onAddAt(0)}
                highlight={dragId !== null}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

function Btn({
  title,
  onClick,
  d,
  danger,
}: {
  title: string;
  onClick: () => void;
  d: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`grid h-6 w-6 place-items-center rounded transition-colors ${
        danger ? "text-[#ff6a5e] hover:bg-[#3a2020]" : "text-[#9aa1ab] hover:bg-[#22262b] hover:text-[#e8eaed]"
      }`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </button>
  );
}

function AddLine({
  y,
  left,
  width,
  canvas,
  onClick,
  highlight,
}: {
  y: number;
  left: number;
  width: number;
  canvas: Rect;
  onClick: () => void;
  highlight: boolean;
}) {
  if (y < canvas.y || y > canvas.y + canvas.h) return null;
  return (
    <div
      className="group fixed z-[44] flex items-center justify-center"
      style={{ left, top: y - 11, width, height: 22 }}
    >
      <button
        type="button"
        onClick={onClick}
        className={`pointer-events-auto flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all ${
          highlight
            ? "border-[#e8261e] bg-[#e8261e] text-white opacity-100"
            : "border-[#2a2e34] bg-[#15181c] text-[#9aa1ab] opacity-0 group-hover:opacity-100 hover:border-[#e8261e] hover:text-[#ff6a5e]"
        }`}
      >
        + 섹션 추가
      </button>
    </div>
  );
}
