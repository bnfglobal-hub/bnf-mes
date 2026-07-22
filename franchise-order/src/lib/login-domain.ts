/** 아이디 → 내부 인증 이메일 변환. Supabase Auth는 이메일 기반이므로 아이디를 가상 도메인 이메일로 매핑한다. */
export const AUTH_EMAIL_DOMAIN = "bnf-order.local";

/** 가맹점 아이디는 사업자등록번호. 하이픈/공백을 제거하고 소문자로 정규화한다. (예: "123-45-67890" → "1234567890") */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/[-\s]/g, "");
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`;
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9._]{3,30}$/i.test(normalizeUsername(username));
}

/** 사업자등록번호 형식(숫자 10자리) 여부 — 안내 문구용 */
export function isBizNo(username: string): boolean {
  return /^\d{10}$/.test(normalizeUsername(username));
}

export const INITIAL_PASSWORD = "1234";
