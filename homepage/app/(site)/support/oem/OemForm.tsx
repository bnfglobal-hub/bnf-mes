"use client";

import { useState } from "react";

/* 원본 사이트의 'OEM제조 견적 신청' 폼 항목을 그대로 옮김.
   현재는 전송 백엔드가 없어, 입력 내용을 메일 본문으로 정리해 보여준다.
   (전송 방식은 추후 결정 — 메일 API / 스프레드시트 / 사내 MES 연동) */

const FIELD = "w-full border border-line px-4 py-3 text-[14px] outline-none transition-colors focus:border-brand";
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
  const [done, setDone] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const summary = [
      `문의 종류: ${f.get("type")}`,
      `사업자명: ${f.get("company")}`,
      `주소: ${f.get("address")}`,
      `담당자: ${f.get("manager")}`,
      `전화번호: ${f.get("tel1")}-${f.get("tel2")}-${f.get("tel3")}`,
      `이메일: ${f.get("email")}`,
      "",
      "내용:",
      String(f.get("message") ?? ""),
    ].join("\n");
    setDone(summary);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (done) {
    return (
      <div className="border border-line p-8">
        <h2 className="text-[18px] font-extrabold text-brand">작성 내용이 정리되었습니다</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          아직 자동 전송 기능이 연결되지 않았습니다. 아래 내용을 복사해
          대표번호(<span className="tabular-nums">{tel}</span>)로 문의하시거나,
          팩스(<span className="tabular-nums">{fax}</span>)로 보내주세요.
        </p>
        <pre className="mt-5 overflow-x-auto whitespace-pre-wrap bg-surface-2 p-5 text-[13px] leading-relaxed">
          {done}
        </pre>
        <button
          type="button"
          onClick={() => setDone(null)}
          className="mt-5 border border-line px-5 py-3 text-[13.5px] font-bold transition-colors hover:border-ink"
        >
          다시 작성하기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div>
        <label htmlFor="type" className={LABEL}>
          문의 종류 <span className="text-brand">*</span>
        </label>
        <select id="type" name="type" required defaultValue="" className={`${FIELD} mt-2`}>
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
        <input id="company" name="company" required autoComplete="organization" className={`${FIELD} mt-2`} />
      </div>

      <div>
        <label htmlFor="address" className={LABEL}>
          주소 <span className="text-brand">*</span>
        </label>
        <input id="address" name="address" required autoComplete="street-address" className={`${FIELD} mt-2`} />
      </div>

      <div>
        <label htmlFor="manager" className={LABEL}>
          담당자 <span className="text-brand">*</span>
        </label>
        <input id="manager" name="manager" required autoComplete="name" className={`${FIELD} mt-2`} />
      </div>

      <fieldset>
        <legend className={LABEL}>
          전화번호 <span className="text-brand">*</span>
        </legend>
        <div className="mt-2 flex items-center gap-2">
          <input aria-label="전화번호 앞자리" name="tel1" required inputMode="numeric" maxLength={4} className={FIELD} />
          <span aria-hidden="true" className="text-faint">-</span>
          <input aria-label="전화번호 가운데자리" name="tel2" required inputMode="numeric" maxLength={4} className={FIELD} />
          <span aria-hidden="true" className="text-faint">-</span>
          <input aria-label="전화번호 뒷자리" name="tel3" required inputMode="numeric" maxLength={4} className={FIELD} />
        </div>
      </fieldset>

      <div>
        <label htmlFor="email" className={LABEL}>
          이메일 <span className="text-brand">*</span>
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={`${FIELD} mt-2`} />
      </div>

      <div>
        <label htmlFor="message" className={LABEL}>
          내용 <span className="text-brand">*</span>
        </label>
        <textarea id="message" name="message" required rows={8} aria-describedby="message-help" className={`${FIELD} mt-2 resize-y`} />
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

      <button
        type="submit"
        className="w-full bg-brand px-6 py-4 text-[15px] font-bold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!agree}
      >
        보내기
      </button>
    </form>
  );
}
