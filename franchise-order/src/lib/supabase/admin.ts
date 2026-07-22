import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * 서비스 역할 클라이언트 — RLS 우회. 반드시 서버 전용 코드에서만 사용.
 * (server-only import로 클라이언트 번들 유입 시 빌드 오류 발생)
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
