"use client";

import { TEMPLATES } from "./templates";

/** 섹션 추가 창 — 미리 만들어진 구성을 고르면 그 자리에 들어간다. */
export default function SectionLibrary({
  onPick,
  onClose,
}: {
  onPick: (key: string) => void;
  onClose: () => void;
}) {
  const groups = ["기본", "이미지", "강조"] as const;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-[720px] overflow-y-auto rounded-xl border border-[#2a2e34] bg-[#15181c] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-extrabold text-[#e8eaed]">섹션 추가</h2>
            <p className="mt-1 text-[12.5px] text-[#7b828c]">원하는 구성을 고르면 홈 화면에 바로 들어갑니다.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-[#7b828c] transition-colors hover:bg-[#22262b] hover:text-[#e8eaed]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {groups.map((g) => {
          const items = TEMPLATES.filter((t) => t.group === g);
          if (!items.length) return null;
          return (
            <section key={g} className="mb-6 last:mb-0">
              <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b828c]">{g}</h3>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {items.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => onPick(t.key)}
                    className="group rounded-lg border border-[#2a2e34] bg-[#191d22] p-3 text-left transition-colors hover:border-[#e8261e]"
                  >
                    <Thumb type={t.type} />
                    <p className="mt-2.5 text-[13px] font-bold text-[#e8eaed] group-hover:text-[#ff8a80]">{t.name}</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-[#7b828c]">{t.desc}</p>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** 구성이 어떤 모양인지 보여주는 작은 그림 */
function Thumb({ type }: { type: string }) {
  const bar = "rounded-[2px] bg-[#3a3f46]";
  const box = "rounded-[3px] bg-[#4a5058]";
  return (
    <div className="flex h-[62px] w-full items-center justify-center gap-1.5 rounded-md bg-[#101317] p-2.5">
      {type === "imageText" && (
        <>
          <div className={`${box} h-full w-1/2`} />
          <div className="flex h-full w-1/2 flex-col justify-center gap-1">
            <div className={`${bar} h-1.5 w-3/4`} /><div className={`${bar} h-1 w-full`} /><div className={`${bar} h-1 w-5/6`} />
          </div>
        </>
      )}
      {type === "textImage" && (
        <>
          <div className="flex h-full w-1/2 flex-col justify-center gap-1">
            <div className={`${bar} h-1.5 w-3/4`} /><div className={`${bar} h-1 w-full`} /><div className={`${bar} h-1 w-5/6`} />
          </div>
          <div className={`${box} h-full w-1/2`} />
        </>
      )}
      {type === "gallery" && (
        <div className="grid h-full w-full grid-cols-4 gap-1">
          {[0, 1, 2, 3].map((i) => <div key={i} className={box} />)}
        </div>
      )}
      {type === "banner" && (
        <div className={`${box} relative h-full w-full`}>
          <div className="absolute inset-0 grid place-items-center"><div className={`${bar} h-1.5 w-1/2 bg-[#8b939c]`} /></div>
        </div>
      )}
      {type === "video" && (
        <div className={`${box} relative h-full w-full`}>
          <div className="absolute inset-0 grid place-items-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#8b939c"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
      )}
      {type === "text" && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
          <div className={`${bar} h-2 w-1/2`} /><div className={`${bar} h-1 w-3/4`} /><div className={`${bar} h-1 w-2/3`} />
        </div>
      )}
      {type === "stats" && (
        <div className="grid h-full w-full grid-cols-4 items-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`${bar} h-2.5 w-full bg-[#5c636d]`} /><div className={`${bar} h-1 w-3/4`} />
            </div>
          ))}
        </div>
      )}
      {type === "cta" && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
          <div className={`${bar} h-1.5 w-2/3`} />
          <div className="h-3.5 w-1/3 rounded-[3px] bg-[#e8261e]" />
        </div>
      )}
      {type === "spacer" && <div className="h-full w-full rounded border border-dashed border-[#3a3f46]" />}
    </div>
  );
}
