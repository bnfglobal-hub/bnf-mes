"use client";

import { useState } from "react";

/* 원본 사이트의 'OEM제조 견적 신청' 폼.
   보내기를 누르면 Supabase 엣지함수(submit-inquiry)로 접수되고,
   MES 관리자에게 알림과 휴대폰 푸시가 전달된다. */

const SUBMIT_URL =
  process.env.NEXT_PUBLIC_INQUIRY_URL ??
  "https://fchxlplnacyycuddvdmu.supabase.co/functions/v1/submit-inquiry";

const FIELD =
  "w-full border border-line px-4 py-3 text-[14px] outline-none transition-colors focus:border-brand disabled:bg-surface-2";
const LABEL = "block text-[13.5px] font-bold";

export default function OemForm({
  types,
  messageHelp,
  privacyText,
  tel,
  fax,
}: {
  types: string[];
  messageHelp: string;
  privacyText: string;
  tel: string;
  fax: string;
}) {
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");

    const f = new FormData(e.currentTarget);
    const payload = {
      kind: "oem",
      type: String(f.get("type") ?? ""),
      company: String(f.get("company") ?? ""),
      address: String(f.get("address") ?? ""),
      manager: String(f.get("manager") ?? ""),
      phone: [f.get("tel1"), f.get("tel2"), f.get("tel3")].filter(Boolean).join("-"),
      email: String(f.get("email") ?? ""),
      message: String(f.get("message") ?? ""),
      website: String(f.get("website") ?? ""), // 스팸 차단용 숨김칸
    };

    try {
      const r = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "접수에 실패했습니다");
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErr(
        e instanceof Error
          ? e.message
          : "접수 중 문제가 생겼습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="border border-line p-8">
        <h2 className="text-[19px] font-extrabold text-brand">문의가 접수되었습니다</h2>
        <p className="mt-3 text-[14px] leading-relaxed">
          담당자가 확인 후 영업일 기준 1~2일 내에 연락드리겠습니다.
        </p>
        <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
          급한 건은 대표번호{" "}
          <a href={`tel:${tel}`} className="font-bold text-ink tabular-nums hover:text-brand">
            {tel}
          </a>
          로 전화 주시면 더 빠릅니다.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-6 border border-line px-5 py-3 text-[13.5px] font-bold transition-colors hover:border-ink"
        >
          다른 문의 남기기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      {/* 스팸 로봇 유인용 숨김칸 — 사람은 보이지 않으므로 비워둔다 */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div>
        <label htmlFor="type" className={LABEL}>
          문의 종류 <span className="text-brand">*</span>
        </label>
        <select id="type" name="type" required defaultValue="" className={`${FIELD} mt-2`} disabled={busy}>
          <option value="" disabled>선택하세요.</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="company" className={LABEL}>
          사업자명 <span className="text-brand">*</span>
        </label>
        <input id="company" name="company" required autoComplete="organization" disabled={busy} className={`${FIELD} mt-2`} />
      </div>

      <div>
        <label htmlFor="address" className={LABEL}>
          주소 <span className="text-brand">*</span>
        </label>
        <input id="address" name="address" required autoComplete="street-address" disabled={busy} className={`${FIELD} mt-2`} />
      </div>

      <div>
        <label htmlFor="manager" className={LABEL}>
          담당자 <span className="text-brand">*</span>
        </label>
        <input id="manager" name="manager" required autoComplete="name" disabled={busy} className={`${FIELD} mt-2`} />
      </div>

      <fieldset>
        <legend className={LABEL}>
          전화번호 <span className="text-brand">*</span>
        </legend>
        <div className="mt-2 flex items-center gap-2">
          <input aria-label="전화번호 앞자리" name="tel1" required inputMode="numeric" maxLength={4} disabled={busy} className={FIELD} />
          <span aria-hidden="true" className="text-faint">-</span>
          <input aria-label="전화번호 가운데자리" name="tel2" required inputMode="numeric" maxLength={4} disabled={busy} className={FIELD} />
          <span aria-hidden="true" className="text-faint">-</span>
          <input aria-label="전화번호 뒷자리" name="tel3" required inputMode="numeric" maxLength={4} disabled={busy} className={FIELD} />
        </div>
      </fieldset>

      <div>
        <label htmlFor="email" className={LABEL}>
          이메일 <span className="text-brand">*</span>
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" disabled={busy} className={`${FIELD} mt-2`} />
      </div>

      <div>
        <label htmlFor="message" className={LABEL}>
          내용 <span className="text-brand">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={8}
          maxLength={5000}
          disabled={busy}
          aria-describedby="message-help"
          className={`${FIELD} mt-2 resize-y`}
        />
        <p id="message-help" className="mt-2 text-[12.5px] text-muted">
          {messageHelp}
        </p>
      </div>

      <div className="border-t border-line pt-6">
        <label className="flex items-start gap-2.5 text-[13.5px]">
          <input
            type="checkbox"
            required
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            disabled={busy}
            className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
          />
          <span>
            <strong className="font-bold">
              개인정보 수집 및 이용 동의 <span className="text-brand">*</span>
            </strong>
            <br />
            <span className="text-muted">{privacyText}</span>
          </span>
        </label>
      </div>

      {err && (
        <p role="alert" className="border border-brand bg-brand-soft px-4 py-3 text-[13.5px] font-bold text-brand">
          {err}
          <br />
          <span className="font-normal">
            계속 안 되면 대표번호 {tel} 또는 팩스 {fax}로 연락 주세요.
          </span>
        </p>
      )}

      <button
        type="submit"
        className="w-full bg-brand px-6 py-4 text-[15px] font-bold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!agree || busy}
      >
        {busy ? "보내는 중..." : "보내기"}
      </button>
    </form>
  );
}
