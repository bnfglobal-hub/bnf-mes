-- 메시지 수발주(msg-hub) 테이블 — 엣지 함수 msg-hub(service role)만 접근. RLS 켜고 정책 없음(anon 직접 접근 차단)
create table if not exists public.msg_hub(
  id bigserial primary key,
  kind text not null,                 -- in(수신) | out(발송)
  status text not null default 'new', -- in: new/confirmed/rejected/ignored · out: queued/sending/sent/failed
  ch text,                            -- in: sms|kakao · out: phone_sms|kakao_reply|api_sms|alimtalk
  peer text,                          -- 전화번호 또는 카톡방 이름
  peer_name text,
  customer text,
  body text,
  parsed jsonb,
  reply text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists msg_hub_kind_idx on public.msg_hub(kind, status, created_at desc);
create index if not exists msg_hub_peer_idx on public.msg_hub(peer, created_at desc);

create table if not exists public.msg_hub_cfg(
  id int primary key,
  cfg jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
insert into public.msg_hub_cfg(id,cfg) values (1, jsonb_build_object(
  'device_key', substr(md5(random()::text||clock_timestamp()::text),1,24),
  'auto_reply', true,
  'only_contacts', false,
  'contacts', '[]'::jsonb,
  'notify_ids', '[]'::jsonb
)) on conflict do nothing;

alter table public.msg_hub enable row level security;
alter table public.msg_hub_cfg enable row level security;
