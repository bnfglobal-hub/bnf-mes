/** 아이디 → 내부 인증 이메일 변환. Supabase Auth는 이메일 기반이므로 아이디를 가상 도메인 이메일로 매핑한다. */
export const AUTH_EMAIL_DOMAIN = "bnf-order.local";

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9._-]{3,30}$/i.test(username.trim());
}
