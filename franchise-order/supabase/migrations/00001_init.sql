-- =============================================================
-- BNF 프랜차이즈 물류 - 초기 스키마
-- 실행: supabase db push  또는  Supabase SQL Editor에 붙여넣기
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- ENUM ----------
create type user_role as enum ('super_admin','hq_admin','warehouse','franchise_owner','franchise_staff');
create type storage_type as enum ('ROOM','CHILLED','FROZEN');          -- 상온/냉장/냉동
create type tax_type as enum ('TAXABLE','EXEMPT');                     -- 과세/면세
create type order_status as enum ('DRAFT','PENDING','CONFIRMED','PICKING','PICKED','SHIPPED','PARTIALLY_SHIPPED','DELIVERED','CANCEL_REQUESTED','CANCELLED','REJECTED');
create type erp_sync_status as enum ('NOT_READY','QUEUED','SYNCING','SUCCESS','FAILED','RETRYING','MANUAL_REVIEW');
create type stock_display_mode as enum ('EXACT','LEVEL','HIDDEN','SOLDOUT_ONLY'); -- 정확/충분·부족·품절/숨김/품절만
create type min_amount_basis as enum ('SUPPLY','WITH_VAT');
create type claim_type as enum ('NOT_DELIVERED','WRONG_ITEM','SHORTAGE','DAMAGED','THAWED','QUALITY','EXPIRY','OTHER');
create type claim_status as enum ('RECEIVED','REVIEWING','PICKUP_PLANNED','REDELIVERY_PLANNED','RESOLVED','REJECTED');
create type claim_resolution as enum ('REDELIVERY','RETURN','REFUND','NEGOTIATE');
create type notification_type as enum ('ORDER_PLACED','ORDER_CONFIRMED','ORDER_REJECTED','ORDER_UPDATED','ORDER_CANCELLED','SHIPPED','DELIVERED','ERP_FAILED','LOW_STOCK','ANNOUNCEMENT','CLAIM');

-- ---------- 공통 트리거 ----------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- ---------- 조직 ----------
create table headquarters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  biz_no text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  headquarters_id uuid references headquarters(id),
  name text not null,
  code text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 거래처(고객사)
create table customers (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id),
  ecount_customer_code text unique,        -- 이카운트 거래처코드
  name text not null,
  biz_no text,
  ceo_name text,
  phone text,
  email text,
  payment_terms text,
  memo text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table warehouses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,               -- 이카운트 창고코드
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 가맹점
create table stores (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  brand_id uuid references brands(id),
  ecount_customer_code text,               -- 이카운트 거래처코드(지점별 전표용)
  store_code text not null unique,         -- 고객 고유코드 (로그인 아이디와 분리)
  name text not null,
  biz_no text,
  ceo_name text,
  manager_name text,
  phone text,
  email text,
  postal_code text,
  address1 text,
  address2 text,
  delivery_note text,
  delivery_zone text,
  default_warehouse_id uuid references warehouses(id),
  delivery_days int[] not null default '{1,2,3,4,5}',  -- 0=일 ~ 6=토
  order_cutoff time not null default '15:00',
  min_order_amount numeric(14,0) not null default 0,
  min_amount_basis min_amount_basis not null default 'SUPPLY',
  delivery_fee numeric(14,0) not null default 0,
  free_delivery_threshold numeric(14,0),
  payment_terms text,
  is_active boolean not null default true,
  order_blocked boolean not null default false,
  is_dormant boolean not null default false,
  admin_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);
create index idx_stores_brand on stores(brand_id);
create index idx_stores_customer on stores(customer_id);

-- ---------- 사용자 ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  full_name text not null,
  phone text,
  role user_role not null default 'franchise_staff',
  store_id uuid references stores(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_store on profiles(store_id);

-- 가맹점-사용자 (다점포 사용자 확장용, 권한 범위)
create table store_users (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  can_order boolean not null default true,
  can_view_price boolean not null default true,
  created_at timestamptz not null default now(),
  unique(store_id, profile_id)
);

-- 배송지
create table addresses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  label text not null default '기본',
  postal_code text,
  address1 text not null,
  address2 text,
  receiver text,
  phone text,
  delivery_note text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_addresses_store on addresses(store_id);

-- ---------- 상품 ----------
create table product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references product_categories(id),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  ecount_item_code text unique,            -- 이카운트 품목코드
  name text not null,
  spec text,                               -- 규격
  barcode text,
  category_id uuid references product_categories(id),
  brand_id uuid references brands(id),
  storage_type storage_type not null default 'ROOM',
  tax_type tax_type not null default 'TAXABLE',
  base_price numeric(14,0) not null default 0,       -- 기본 공급가(원)
  retail_price numeric(14,0),
  box_qty int,                             -- 박스 입수량
  order_unit text not null default 'EA',
  min_order_qty int not null default 1,
  max_order_qty int,
  qty_step int not null default 1,
  weight_g int,
  thumbnail_url text,
  detail_image_url text,
  is_soldout boolean not null default false,
  is_discontinued boolean not null default false,
  is_new boolean not null default false,
  is_recommended boolean not null default false,
  stock_display stock_display_mode,        -- null이면 시스템 기본
  sort_order int not null default 0,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);
create index idx_products_category on products(category_id);
create index idx_products_name on products(name);

-- 가맹점별 취급상품
create table store_products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  custom_price numeric(14,0),              -- 가맹점 전용 공급가
  discount_rate numeric(5,2),
  min_order_qty int,
  max_order_qty int,
  qty_step int,
  is_visible boolean not null default true,
  is_soldout boolean not null default false,
  sort_order int not null default 0,
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  unique(store_id, product_id)
);
create index idx_store_products_store on store_products(store_id);

-- 가맹점별 단가 이력
create table store_prices (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  price numeric(14,0) not null,
  valid_from date not null default current_date,
  valid_to date,
  created_at timestamptz not null default now(),
  created_by uuid
);
create index idx_store_prices_lookup on store_prices(store_id, product_id, valid_from desc);

-- ---------- 재고 ----------
create table inventory_snapshots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  warehouse_id uuid references warehouses(id),
  qty numeric(14,2) not null default 0,
  safety_qty numeric(14,2) not null default 0,
  synced_at timestamptz not null default now(),
  unique(product_id, warehouse_id)
);
create index idx_inv_product on inventory_snapshots(product_id);

create table inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid,
  product_id uuid not null references products(id),
  warehouse_id uuid references warehouses(id),
  qty numeric(14,2) not null,
  released boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_resv_product on inventory_reservations(product_id) where not released;

-- ---------- 장바구니 ----------
create table carts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  memo text,
  requested_delivery_date date,
  address_id uuid references addresses(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(store_id, profile_id)
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  qty int not null check (qty > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id, product_id)
);

-- ---------- 주문 ----------
create table order_no_counters (
  order_date date primary key,
  seq int not null default 0
);

create or replace function next_order_no(p_date date default current_date)
returns text language plpgsql as $$
declare v_seq int;
begin
  insert into order_no_counters(order_date, seq) values (p_date, 1)
  on conflict (order_date) do update set seq = order_no_counters.seq + 1
  returning seq into v_seq;
  return 'BNF-' || to_char(p_date,'YYYYMMDD') || '-' || lpad(v_seq::text, 5, '0');
end $$;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  store_id uuid not null references stores(id),
  ecount_customer_code text,
  ordered_at timestamptz not null default now(),
  requested_delivery_date date,
  planned_ship_date date,
  warehouse_id uuid references warehouses(id),
  supply_amount numeric(14,0) not null default 0,
  vat_amount numeric(14,0) not null default 0,
  delivery_fee numeric(14,0) not null default 0,
  total_amount numeric(14,0) not null default 0,
  memo text,
  ship_to jsonb,                            -- 배송지 스냅샷
  status order_status not null default 'PENDING',
  erp_status erp_sync_status not null default 'NOT_READY',
  ecount_doc_no text,                       -- 이카운트 전표/주문번호
  idempotency_key text unique,              -- ERP 중복 전송 방지
  client_request_id text,                   -- 클라이언트 중복 제출 방지
  created_by uuid references profiles(id),
  confirmed_by uuid references profiles(id),
  cancelled_by uuid references profiles(id),
  confirmed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_store on orders(store_id, ordered_at desc);
create index idx_orders_status on orders(status);
create index idx_orders_erp on orders(erp_status);
create index idx_orders_ship_date on orders(planned_ship_date);
create unique index idx_orders_client_req on orders(store_id, client_request_id) where client_request_id is not null;

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_snapshot jsonb not null,          -- 주문 당시 품명/규격/코드
  qty int not null check (qty > 0),
  unit_price numeric(14,0) not null,        -- 주문 당시 단가(공급가)
  supply_amount numeric(14,0) not null,
  vat_amount numeric(14,0) not null,
  shipped_qty int not null default 0,
  unshipped_reason text,
  created_at timestamptz not null default now()
);
create index idx_order_items_order on order_items(order_id);

create table order_status_histories (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  changed_by uuid references profiles(id),
  reason text,
  changed_at timestamptz not null default now()
);
create index idx_osh_order on order_status_histories(order_id);

-- ---------- 피킹/출고 ----------
create table picking_batches (
  id uuid primary key default gen_random_uuid(),
  ship_date date not null,
  warehouse_id uuid references warehouses(id),
  status text not null default 'OPEN',      -- OPEN/DONE
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table picking_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references picking_batches(id) on delete cascade,
  order_item_id uuid not null references order_items(id),
  planned_qty int not null,
  picked_qty int not null default 0,
  shortage_qty int not null default 0,
  is_done boolean not null default false,
  picked_by uuid references profiles(id),
  picked_at timestamptz
);
create index idx_picking_items_batch on picking_items(batch_id);

create table shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  ship_date date not null default current_date,
  driver_name text,
  vehicle_no text,
  delivery_zone text,
  tracking_no text,
  departed_at timestamptz,
  delivered_at timestamptz,
  memo text,
  proof_image_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index idx_shipments_order on shipments(order_id);

create table shipment_items (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete cascade,
  order_item_id uuid not null references order_items(id),
  qty int not null
);

-- ---------- 클레임 ----------
create table claims (
  id uuid primary key default gen_random_uuid(),
  claim_no text not null unique,
  order_id uuid not null references orders(id),
  store_id uuid not null references stores(id),
  claim_type claim_type not null,
  status claim_status not null default 'RECEIVED',
  resolution claim_resolution,
  reason text,
  detail text,
  admin_note text,
  created_by uuid references profiles(id),
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_claims_store on claims(store_id);
create index idx_claims_status on claims(status);

create table claim_items (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  order_item_id uuid references order_items(id),
  product_id uuid references products(id),
  qty int not null default 1,
  photo_urls text[]
);

-- ---------- 공지 ----------
create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  is_pinned boolean not null default false,
  is_important boolean not null default false,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  attachment_urls text[],
  target_all boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table announcement_targets (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references announcements(id) on delete cascade,
  brand_id uuid references brands(id),
  store_id uuid references stores(id),
  delivery_zone text
);
create index idx_ann_targets on announcement_targets(announcement_id);

create table announcement_reads (
  announcement_id uuid not null references announcements(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, profile_id)
);

-- ---------- 알림 ----------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_profile on notifications(profile_id, is_read, created_at desc);

create table notification_logs (
  id uuid primary key default gen_random_uuid(),
  channel text not null,                    -- IN_APP/WEB_PUSH/EMAIL/SMS/ALIMTALK/MOCK
  recipient text,
  title text,
  body text,
  status text not null default 'SENT',
  error text,
  created_at timestamptz not null default now()
);

-- ---------- 이카운트 연동 ----------
create table ecount_connections (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'default',
  mode text not null default 'MOCK',        -- MOCK/REAL
  base_url text,
  company_code text,
  api_user_id text,
  zone text,
  default_warehouse_code text,
  order_input_policy text not null default 'ORDER',  -- ORDER(주문서입력)/SALE(판매입력)
  sync_enabled boolean not null default false,
  last_ok_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ecount_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,                   -- ORDER_PUSH/ITEM_PULL/STOCK_PULL
  order_id uuid references orders(id),
  idempotency_key text unique,
  status erp_sync_status not null default 'QUEUED',
  attempts int not null default 0,
  max_attempts int not null default 5,
  next_retry_at timestamptz,
  last_error_code text,
  last_error_message text,
  ecount_doc_no text,
  payload jsonb,
  response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_sync_jobs_status on ecount_sync_jobs(status, next_retry_at);
create index idx_sync_jobs_order on ecount_sync_jobs(order_id);

create table ecount_sync_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references ecount_sync_jobs(id) on delete set null,
  direction text not null,                  -- REQUEST/RESPONSE
  summary text,
  masked_payload jsonb,
  created_at timestamptz not null default now()
);

-- ---------- 운영 설정 ----------
create table holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  name text,
  no_shipping boolean not null default true,
  created_at timestamptz not null default now()
);

create table delivery_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'default',
  weekday_cutoff time not null default '15:00',
  allow_saturday_order boolean not null default true,
  allow_holiday_order boolean not null default false,
  min_lead_days int not null default 1,
  allow_same_day boolean not null default false,
  ship_days int[] not null default '{1,2,3,4,5}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table system_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  action text not null,                     -- ORDER_UPDATE / PRODUCT_UPDATE ...
  entity text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  ip text,
  created_at timestamptz not null default now()
);
create index idx_audit_entity on audit_logs(entity, entity_id);
create index idx_audit_created on audit_logs(created_at desc);

create table files (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  original_name text,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- updated_at 트리거 일괄 ----------
do $$
declare t text;
begin
  foreach t in array array['headquarters','brands','customers','warehouses','stores','profiles','addresses','products','store_products','carts','cart_items','orders','claims','announcements','ecount_connections','ecount_sync_jobs','delivery_rules']
  loop
    execute format('create trigger trg_%s_updated before update on %I for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

-- =============================================================
-- RLS
-- =============================================================

-- 헬퍼: 현재 사용자 role / store
create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function auth_store_id() returns uuid
language sql stable security definer set search_path = public as $$
  select store_id from profiles where id = auth.uid()
$$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select auth_role() in ('super_admin','hq_admin','warehouse')
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select auth_role() in ('super_admin','hq_admin')
$$;

-- 모든 테이블 RLS 활성화
do $$
declare t text;
begin
  foreach t in array array['headquarters','brands','customers','warehouses','stores','profiles','store_users','addresses','product_categories','products','store_products','store_prices','inventory_snapshots','inventory_reservations','carts','cart_items','orders','order_items','order_status_histories','picking_batches','picking_items','shipments','shipment_items','claims','claim_items','announcements','announcement_targets','announcement_reads','notifications','notification_logs','ecount_connections','ecount_sync_jobs','ecount_sync_logs','holidays','delivery_rules','system_settings','audit_logs','files','order_no_counters']
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- 본사/창고 직원: 업무 테이블 전체 접근
do $$
declare t text;
begin
  foreach t in array array['headquarters','brands','customers','warehouses','stores','store_users','addresses','product_categories','products','store_products','store_prices','inventory_snapshots','inventory_reservations','orders','order_items','order_status_histories','picking_batches','picking_items','shipments','shipment_items','claims','claim_items','announcements','announcement_targets','announcement_reads','notifications','holidays','delivery_rules','files']
  loop
    execute format('create policy staff_all_%s on %I for all using (is_staff()) with check (is_staff())', t, t);
  end loop;
end $$;

-- 관리자 전용
do $$
declare t text;
begin
  foreach t in array array['ecount_connections','ecount_sync_jobs','ecount_sync_logs','system_settings','audit_logs','notification_logs']
  loop
    execute format('create policy admin_all_%s on %I for all using (is_admin()) with check (is_admin())', t, t);
  end loop;
end $$;

-- profiles: 본인 조회/수정, 관리자 전체
create policy profiles_self_select on profiles for select using (id = auth.uid() or is_staff());
create policy profiles_self_update on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from profiles p where p.id = auth.uid()));
create policy profiles_admin_all on profiles for all using (is_admin()) with check (is_admin());

-- 가맹점 사용자 정책
create policy fr_stores_select on stores for select using (id = auth_store_id());
create policy fr_brands_select on brands for select using (auth.uid() is not null);
create policy fr_warehouses_select on warehouses for select using (auth.uid() is not null);
create policy fr_categories_select on product_categories for select using (auth.uid() is not null);

-- 상품: 자기 가맹점 매핑 상품만
create policy fr_products_select on products for select using (
  exists (select 1 from store_products sp where sp.product_id = products.id and sp.store_id = auth_store_id() and sp.is_visible)
);
create policy fr_store_products_select on store_products for select using (store_id = auth_store_id());
create policy fr_store_prices_select on store_prices for select using (store_id = auth_store_id());

-- 재고: 매핑 상품만 (표시 정책은 앱단에서 제어)
create policy fr_inventory_select on inventory_snapshots for select using (
  exists (select 1 from store_products sp where sp.product_id = inventory_snapshots.product_id and sp.store_id = auth_store_id() and sp.is_visible)
);

-- 배송지
create policy fr_addresses_all on addresses for all
  using (store_id = auth_store_id()) with check (store_id = auth_store_id());

-- 장바구니
create policy fr_carts_all on carts for all
  using (store_id = auth_store_id() and profile_id = auth.uid())
  with check (store_id = auth_store_id() and profile_id = auth.uid());
create policy fr_cart_items_all on cart_items for all
  using (exists (select 1 from carts c where c.id = cart_id and c.profile_id = auth.uid()))
  with check (exists (select 1 from carts c where c.id = cart_id and c.profile_id = auth.uid()));

-- 주문: 자기 가맹점만 조회 (생성은 서버 API 경유)
create policy fr_orders_select on orders for select using (store_id = auth_store_id());
create policy fr_order_items_select on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and o.store_id = auth_store_id())
);
create policy fr_osh_select on order_status_histories for select using (
  exists (select 1 from orders o where o.id = order_id and o.store_id = auth_store_id())
);
create policy fr_shipments_select on shipments for select using (
  exists (select 1 from orders o where o.id = order_id and o.store_id = auth_store_id())
);
create policy fr_shipment_items_select on shipment_items for select using (
  exists (select 1 from shipments s join orders o on o.id = s.order_id where s.id = shipment_id and o.store_id = auth_store_id())
);

-- 클레임: 자기 가맹점 등록/조회
create policy fr_claims_select on claims for select using (store_id = auth_store_id());
create policy fr_claims_insert on claims for insert with check (store_id = auth_store_id() and created_by = auth.uid());
create policy fr_claim_items_select on claim_items for select using (
  exists (select 1 from claims c where c.id = claim_id and c.store_id = auth_store_id())
);
create policy fr_claim_items_insert on claim_items for insert with check (
  exists (select 1 from claims c where c.id = claim_id and c.store_id = auth_store_id())
);

-- 공지: 대상 매칭
create policy fr_announcements_select on announcements for select using (
  auth.uid() is not null and starts_at <= now() and (ends_at is null or ends_at >= now())
  and (
    target_all
    or exists (
      select 1 from announcement_targets at_
      join stores s on s.id = auth_store_id()
      where at_.announcement_id = announcements.id
        and (at_.store_id = s.id or at_.brand_id = s.brand_id or at_.delivery_zone = s.delivery_zone)
    )
  )
);
create policy fr_ann_reads_all on announcement_reads for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- 알림: 본인 것만
create policy fr_notifications_select on notifications for select using (profile_id = auth.uid());
create policy fr_notifications_update on notifications for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- 휴일/배송규칙: 로그인 사용자 조회
create policy fr_holidays_select on holidays for select using (auth.uid() is not null);
create policy fr_delivery_rules_select on delivery_rules for select using (auth.uid() is not null);

-- 시스템 설정 중 공개 키만 (예: stock_display 기본값)
create policy fr_settings_select on system_settings for select using (auth.uid() is not null and key like 'public.%');

-- =============================================================
-- 기본 데이터
-- =============================================================
insert into delivery_rules (name) values ('default');
insert into system_settings(key, value) values
  ('public.stock_display', '"LEVEL"'),
  ('public.brand_name', '"BNF 프랜차이즈 물류"'),
  ('ecount.order_policy', '"ORDER"');
