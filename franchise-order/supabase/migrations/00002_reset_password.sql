-- =============================================================
-- 비밀번호 초기화(1234) 지원
-- Supabase Auth는 비밀번호 "변경" 시 최소 6자를 강제하므로,
-- 관리자 초기화(1234)는 이 서버 전용 함수로 처리한다.
-- 실행: Supabase SQL Editor에 붙여넣기
-- =============================================================

create extension if not exists pgcrypto;

create or replace function admin_reset_password(target uuid, new_password text)
returns void
language plpgsql
security definer
set search_path = auth, public, extensions
as $$
begin
  update auth.users
  set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
                           || '{"must_change_password": true}'::jsonb,
      updated_at = now()
  where id = target;
end
$$;

-- service_role(서버)만 실행 가능
revoke all on function admin_reset_password(uuid, text) from public;
revoke all on function admin_reset_password(uuid, text) from anon;
revoke all on function admin_reset_password(uuid, text) from authenticated;
