"use client";

import { useRef, useState } from "react";

/* 편집기 오른쪽 속성 패널에서 쓰는 작은 부품들 */

export function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-[#1f2226] px-4 py-4">
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b828c]">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-3 last:mb-0">
      <span className="w-[52px] shrink-0 text-[11.5px] text-[#9aa1ab]">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export const inp =
  "w-full rounded-md border border-[#2a2e34] bg-[#15181c] px-2.5 py-1.5 text-[12.5px] text-[#e8eaed] outline-none transition-colors focus:border-[#e8261e] placeholder:text-[#5c636d]";

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input className={inp} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  );
}

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <select className={inp} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.v} value={o.v}>{o.l}</option>
      ))}
    </select>
  );
}

/** 숫자 + 단위 슬라이더 (예: 글자 크기, 여백) */
export function NumberSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "px",
  placeholder = "기본",
}: {
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  placeholder?: string;
}) {
  const num = parseFloat(value ?? "");
  const has = !Number.isNaN(num);
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={has ? num : (min + max) / 2}
        onChange={(e) => onChange(e.target.value + unit)}
        className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded bg-[#2a2e34] accent-[#e8261e]"
      />
      <input
        className={`${inp} w-[52px] shrink-0 px-1 text-center text-[11.5px]`}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {has && (
        <button
          type="button"
          onClick={() => onChange("")}
          title="기본값으로"
          className="shrink-0 rounded px-1.5 py-1 text-[11px] text-[#7b828c] transition-colors hover:bg-[#22262b] hover:text-[#e8eaed]"
        >
          ↺
        </button>
      )}
    </div>
  );
}

export function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value ?? "") ? value : "#1a1a1a"}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-8 shrink-0 cursor-pointer rounded border border-[#2a2e34] bg-transparent"
      />
      <input className={`${inp} min-w-0 flex-1 px-1.5 text-[11.5px]`} value={value ?? ""} placeholder="기본" onChange={(e) => onChange(e.target.value)} />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          title="기본값으로"
          className="shrink-0 rounded px-1.5 py-1 text-[11px] text-[#7b828c] transition-colors hover:bg-[#22262b] hover:text-[#e8eaed]"
        >
          ↺
        </button>
      )}
    </div>
  );
}

/** 정렬 선택 (아이콘 버튼) */
export function AlignPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opts = [
    { v: "left", l: "왼쪽", d: "M3 5h14M3 9h9M3 13h14M3 17h9" },
    { v: "center", l: "가운데", d: "M3 5h14M5 9h10M3 13h14M5 17h10" },
    { v: "right", l: "오른쪽", d: "M3 5h14M8 9h9M3 13h14M8 17h9" },
  ];
  return (
    <div className="flex gap-1">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          title={o.l}
          onClick={() => onChange(value === o.v ? "" : o.v)}
          className={`grid h-7 flex-1 place-items-center rounded-md border transition-colors ${
            value === o.v
              ? "border-[#e8261e] bg-[#e8261e]/15 text-[#ff6a5e]"
              : "border-[#2a2e34] text-[#9aa1ab] hover:border-[#3a3f46] hover:text-[#e8eaed]"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 20 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d={o.d} />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1.5">
      <span className="text-[12.5px] text-[#c8ccd2]">{label}</span>
      <span
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        className={`relative h-[18px] w-[32px] shrink-0 rounded-full transition-colors ${
          checked ? "bg-[#e8261e]" : "bg-[#3a3f46]"
        }`}
      >
        <span
          className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-all ${
            checked ? "left-[16px]" : "left-[2px]"
          }`}
        />
      </span>
      <input type="checkbox" checked={checked} onChange={() => {}} className="hidden" />
    </label>
  );
}


/** 여백을 그림으로 보여주며 조절 — 숫자를 몰라도 되게 단계 버튼을 함께 둔다 */
export function SpacingBox({
  top,
  bottom,
  onTop,
  onBottom,
}: {
  top: string;
  bottom: string;
  onTop: (v: string) => void;
  onBottom: (v: string) => void;
}) {
  const STEPS: { l: string; v: string }[] = [
    { l: "없음", v: "0px" },
    { l: "좁게", v: "24px" },
    { l: "보통", v: "56px" },
    { l: "넓게", v: "96px" },
    { l: "기본", v: "" },
  ];

  const Bar = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11.5px] text-[#9aa1ab]">{label}</span>
        <span className="text-[11px] text-[#5c636d] tabular-nums">{value || "기본"}</span>
      </div>
      <div className="flex gap-1">
        {STEPS.map((s) => (
          <button
            key={s.l}
            type="button"
            onClick={() => onChange(s.v)}
            className={`flex-1 rounded border py-1 text-[11px] transition-colors ${
              (value || "") === s.v
                ? "border-[#e8261e] bg-[#e8261e]/15 text-[#ff6a5e]"
                : "border-[#2a2e34] text-[#9aa1ab] hover:border-[#3a3f46] hover:text-[#e8eaed]"
            }`}
          >
            {s.l}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      {/* 여백을 눈으로 보여주는 그림 */}
      <div className="mb-3 rounded-md border border-[#2a2e34] bg-[#101317] p-2">
        <div
          className="rounded bg-[#e8261e]/25"
          style={{ height: Math.min(28, Math.max(2, parseInt(top || "0", 10) / 4 || 2)) }}
        />
        <div className="my-1 grid h-8 place-items-center rounded bg-[#22262b] text-[11px] text-[#7b828c]">
          내용
        </div>
        <div
          className="rounded bg-[#e8261e]/25"
          style={{ height: Math.min(28, Math.max(2, parseInt(bottom || "0", 10) / 4 || 2)) }}
        />
      </div>
      <Bar value={top} onChange={onTop} label="위 여백" />
      <Bar value={bottom} onChange={onBottom} label="아래 여백" />
    </div>
  );
}
