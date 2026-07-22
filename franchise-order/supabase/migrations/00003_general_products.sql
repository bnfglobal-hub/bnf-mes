-- =============================================================
-- 공산품(전 거래처 공용 판매 상품) 지원
-- - products.is_general = true 인 상품은 모든 가맹점이 조회·주문 가능
-- - 일반 거래품목은 기존대로 본사가 가맹점별로 부여(store_products)한 것만 노출
-- 실행: Supabase SQL Editor에 붙여넣기
-- =============================================================

alter table products add column if not exists is_general boolean not null default false;
create index if not exists idx_products_general on products(is_general) where is_general;

-- 가맹점 상품 조회 정책 갱신: 매핑된 상품 + 공산품
drop policy if exists fr_products_select on products;
create policy fr_products_select on products for select using (
  is_general
  or exists (
    select 1 from store_products sp
    where sp.product_id = products.id and sp.store_id = auth_store_id() and sp.is_visible
  )
);

-- 재고 조회 정책도 동일 기준으로 갱신
drop policy if exists fr_inventory_select on inventory_snapshots;
create policy fr_inventory_select on inventory_snapshots for select using (
  exists (
    select 1 from products p
    where p.id = inventory_snapshots.product_id
      and (
        p.is_general
        or exists (
          select 1 from store_products sp
          where sp.product_id = p.id and sp.store_id = auth_store_id() and sp.is_visible
        )
      )
  )
);
