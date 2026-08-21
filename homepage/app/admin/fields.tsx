"use client";

import { useRef, useState } from "react";

/* 편집 화면에서 쓰는 입력 부품들 — 글자, 여러 줄 글, 사진, 목록 */

export const inputCls =
  "w-full border border-[#d5d5d5] bg-white px-3 py-2.5 text-[14px] outline-none transition-colors focus:border-[#e8261e]";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label className="mb-1.5 block text-[13px] font-bold text-[#333]">
        {label}
        {hint && <span className="ml-2 font-normal text-[#888]">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export function Text({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <input className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function TextArea({
  label,
  hint,
  value,
  onChange,
  rows = 6,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <Field label={label} hint={hint ?? "줄바꿈은 Enter, 문단 나누기는 Enter 두 번"}>
      <textarea
        className={`${inputCls} resize-y leading-relaxed`}
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

/** 사진 1장 — 미리보기 + 파일 선택 업로드 */
export function ImagePick({
  label,
  hint,
  value,
  onChange,
  onRemove,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  onRemove?: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pick = async (file: File) => {
    setBusy(true);
    setErr("");
    try {
      const buf = await file.arrayBuffer();
      let bin = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      const r = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: file.name, type: file.type, data: btoa(bin) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "업로드 실패");
      onChange(j.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const isVideo = value?.endsWith(".mp4");

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-start gap-4">
        <div className="grid h-24 w-32 shrink-0 place-items-center overflow-hidden border border-[#ddd] bg-[#f5f5f5]">
          {value ? (
            isVideo ? (
              <video src={value} className="h-full w-full object-cover" muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <span className="text-[12px] text-[#aaa]">없음</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            ref={ref}
            type="file"
            accept="image/*,video/mp4"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pick(f);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => ref.current?.click()}
              disabled={busy}
              className="border border-[#333] bg-white px-3.5 py-2 text-[12.5px] font-bold transition-colors hover:bg-[#333] hover:text-white disabled:opacity-50"
            >
              {busy ? "올리는 중..." : "사진 바꾸기"}
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="border border-[#ddd] px-3.5 py-2 text-[12.5px] text-[#c00] transition-colors hover:border-[#c00]"
              >
                삭제
              </button>
            )}
          </div>
          <input
            className={`${inputCls} mt-2 text-[12px]`}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/uploads/사진.jpg"
          />
          {err && <p className="mt-1 text-[12px] font-bold text-[#c00]">{err}</p>}
        </div>
      </div>
    </Field>
  );
}

/** 글자 목록 (예: 제조 공정 단계, 품목 이름들) */
export function StringList({
  label,
  hint,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  hint?: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const list = value ?? [];
  const set = (i: number, v: string) => onChange(list.map((x, j) => (j === i ? v : x)));
  const move = (i: number, d: number) => {
    const t = i + d;
    if (t < 0 || t >= list.length) return;
    const copy = [...list];
    [copy[i], copy[t]] = [copy[t], copy[i]];
    onChange(copy);
  };

  return (
    <Field label={label} hint={hint}>
      <div className="space-y-2">
        {list.map((item, i) => (
          <div key={i} className="flex gap-1.5">
            <span className="w-6 shrink-0 pt-2.5 text-right text-[12px] text-[#999] tabular-nums">
              {i + 1}
            </span>
            <input
              className={inputCls}
              value={item}
              placeholder={placeholder}
              onChange={(e) => set(i, e.target.value)}
            />
            <RowButtons
              onUp={() => move(i, -1)}
              onDown={() => move(i, 1)}
              onDelete={() => onChange(list.filter((_, j) => j !== i))}
            />
          </div>
        ))}
      </div>
      <AddButton onClick={() => onChange([...list, ""])} />
    </Field>
  );
}

export function RowButtons({
  onUp,
  onDown,
  onDelete,
}: {
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
}) {
  const b = "grid h-9 w-8 shrink-0 place-items-center border border-[#ddd] bg-white text-[13px] transition-colors hover:border-[#333]";
  return (
    <div className="flex gap-1">
      <button type="button" onClick={onUp} title="위로" className={b}>↑</button>
      <button type="button" onClick={onDown} title="아래로" className={b}>↓</button>
      <button
        type="button"
        onClick={onDelete}
        title="삭제"
        className={`${b} text-[#c00] hover:border-[#c00]`}
      >
        ✕
      </button>
    </div>
  );
}

export function AddButton({ onClick, label = "+ 항목 추가" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 border border-dashed border-[#bbb] px-4 py-2.5 text-[12.5px] font-bold text-[#555] transition-colors hover:border-[#e8261e] hover:text-[#e8261e]"
    >
      {label}
    </button>
  );
}

/** 카드형 목록 편집 틀 — 각 항목을 박스로 감싸고 순서/삭제 버튼을 붙인다 */
export function CardList<T>({
  label,
  hint,
  value,
  onChange,
  blank,
  addLabel,
  render,
}: {
  label: string;
  hint?: string;
  value: T[];
  onChange: (v: T[]) => void;
  blank: () => T;
  addLabel?: string;
  render: (item: T, set: (patch: Partial<T>) => void, index: number) => React.ReactNode;
}) {
  const list = value ?? [];
  const move = (i: number, d: number) => {
    const t = i + d;
    if (t < 0 || t >= list.length) return;
    const copy = [...list];
    [copy[i], copy[t]] = [copy[t], copy[i]];
    onChange(copy);
  };

  return (
    <div className="mb-7">
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-[14px] font-extrabold text-[#222]">{label}</h3>
        <span className="text-[12px] text-[#888]">
          {hint ? hint + " · " : ""}
          {list.length}개
        </span>
      </div>

      <div className="space-y-3">
        {list.map((item, i) => (
          <div key={i} className="border border-[#e2e2e2] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#999] tabular-nums">#{i + 1}</span>
              <RowButtons
                onUp={() => move(i, -1)}
                onDown={() => move(i, 1)}
                onDelete={() => onChange(list.filter((_, j) => j !== i))}
              />
            </div>
            {render(
              item,
              (patch) => onChange(list.map((x, j) => (j === i ? { ...x, ...patch } : x))),
              i
            )}
          </div>
        ))}
      </div>

      <AddButton onClick={() => onChange([...list, blank()])} label={addLabel} />
    </div>
  );
}
