"use client";

export type DeviceId = "desktop" | "tablet" | "mobile";

const DEVICES: { id: DeviceId; label: string; icon: string }[] = [
  { id: "desktop", label: "PC", icon: "M3 5h18v11H3zM8 20h8" },
  { id: "tablet", label: "태블릿", icon: "M5 3h14v18H5zM11 18h2" },
  { id: "mobile", label: "모바일", icon: "M7 2h10v20H7zM10 19h4" },
];

export default function Toolbar({
  device,
  onDevice,
  preview,
  onPreview,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onPublish,
  saveState,
  dirty,
  unpublished,
  onOpenMedia,
}: {
  device: DeviceId;
  onDevice: (d: DeviceId) => void;
  preview: boolean;
  onPreview: (v: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPublish: () => void;
  saveState: "idle" | "saving" | "saved";
  dirty: boolean;
  unpublished: boolean;
  onOpenMedia: () => void;
}) {
  return (
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
      <span className="text-[13px] font-bold">홈 화면</span>

      <button
        type="button"
        onClick={onOpenMedia}
        className="rounded-md px-2.5 py-1.5 text-[12.5px] text-[#9aa1ab] transition-colors hover:bg-[#1c1f23] hover:text-[#e8eaed]"
      >
        사진 보관함
      </button>

      {/* 기기 전환 */}
      <div className="mx-auto flex gap-0.5 rounded-lg bg-[#1a1d21] p-1">
        {DEVICES.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onDevice(d.id)}
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

      <div className="flex gap-0.5">
        <IconBtn title="되돌리기 (Ctrl+Z)" disabled={!canUndo} onClick={onUndo} d="M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8" />
        <IconBtn title="다시 실행 (Ctrl+Shift+Z)" disabled={!canRedo} onClick={onRedo} d="M21 7v6h-6M21 13a9 9 0 1 1-3-7.7L21 8" />
      </div>

      <span className="h-5 w-px bg-[#26292e]" />

      {/* 상태 */}
      <span className="min-w-[92px] text-right text-[12px] font-semibold">
        {saveState === "saving" && <span className="text-[#7b828c]">저장 중...</span>}
        {saveState === "saved" && <span className="text-[#4ade80]">저장됨</span>}
        {saveState === "idle" && dirty && <span className="text-[#fbbf24]">저장 안 됨</span>}
        {saveState === "idle" && !dirty && unpublished && (
          <span className="text-[#60a5fa]">게시 대기</span>
        )}
        {saveState === "idle" && !dirty && !unpublished && <span className="text-[#5c636d]">게시됨</span>}
      </span>

      <button
        type="button"
        onClick={() => onPreview(!preview)}
        className={`rounded-md px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
          preview ? "bg-[#2a2e34] text-[#e8eaed]" : "text-[#9aa1ab] hover:bg-[#1c1f23] hover:text-[#e8eaed]"
        }`}
      >
        {preview ? "편집으로" : "미리보기"}
      </button>
      <button
        type="button"
        onClick={onSave}
        className="rounded-md border border-[#2a2e34] px-4 py-1.5 text-[12.5px] font-bold text-[#c8ccd2] transition-colors hover:border-[#4a5058] hover:text-white"
      >
        저장
      </button>
      <button
        type="button"
        onClick={onPublish}
        className="rounded-md bg-[#e8261e] px-4 py-1.5 text-[12.5px] font-bold text-white transition-colors hover:bg-[#c41c15]"
      >
        게시
      </button>
    </header>
  );
}

function IconBtn({
  title,
  disabled,
  onClick,
  d,
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
  d: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-md text-[#9aa1ab] transition-colors hover:bg-[#1c1f23] hover:text-[#e8eaed] disabled:opacity-30"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </button>
  );
}
