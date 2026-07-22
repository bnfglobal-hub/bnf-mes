# 데이터베이스 설계

마이그레이션: `supabase/migrations/00001_init.sql` (전체 스키마 + RLS + 트리거 + 기본 데이터)

## 주요 테이블

| 그룹 | 테이블 | 설명 |
|---|---|---|
| 조직 | headquarters, brands, customers, stores, warehouses | 본사→브랜드→거래처→가맹점 계층 |
| 사용자 | profiles, store_users | auth.users 1:1 프로필, 역할(enum user_role), 소속 가맹점 |
| 상품 | products, product_categories, store_products, store_prices | 마스터/가맹점 매핑/기간 단가 이력 |
| 재고 | inventory_snapshots, inventory_reservations | 이카운트 재고 캐시(synced_at 표시), 주문 예약 |
| 주문 | carts, cart_items, orders, order_items, order_status_histories, order_no_counters | 주문번호 BNF-YYYYMMDD-NNNNN은 `next_order_no()` 함수가 발급 |
| 물류 | picking_batches, picking_items, shipments, shipment_items | 피킹·출고·배송 (부분출고 shipped_qty) |
| CS | claims, claim_items, announcements, announcement_targets, announcement_reads, notifications, notification_logs | |
| 연동 | ecount_connections, ecount_sync_jobs, ecount_sync_logs | 큐 + 마스킹된 로그 |
| 운영 | holidays, delivery_rules, system_settings, audit_logs, files | |

## 규칙

- 금액: `numeric(14,0)` 원 단위 정수 (부동소수점 오류 방지)
- unique index: `orders.order_no`, `orders.idempotency_key`, `(store_id, client_request_id)`,
  `stores.store_code`, `products.ecount_item_code`, `customers.ecount_customer_code`,
  `ecount_sync_jobs.idempotency_key`, `warehouses.code`
- 조회 인덱스: 주문(store+일시, status, erp_status, ship_date), 알림(profile+is_read), 감사(entity, created_at) 등
- 모든 주요 테이블에 created_at/updated_at(트리거)/created_by/updated_by/is_active

## RLS 정책 요약

- 헬퍼: `auth_role()`, `auth_store_id()`, `is_staff()`, `is_admin()` (security definer)
- 본사/창고(`is_staff`): 업무 테이블 전체 접근
- 관리자(`is_admin`)만: ecount_*, system_settings, audit_logs, notification_logs
- 가맹점 사용자:
  - 상품: 자기 가맹점에 매핑(`store_products.is_visible`)된 것만 SELECT
  - 주문/출고/이력: 자기 가맹점(store_id = auth_store_id()) 것만 SELECT — **INSERT는 서버 액션 경유만**
  - 장바구니/배송지/알림읽음: 본인 것 전체 CRUD
  - 공지: 대상(전체/브랜드/가맹점/권역) 매칭 + 노출기간 내만
- URL/API를 직접 조작해도 다른 가맹점 데이터는 RLS에서 차단됨

## 적용 방법

```sql
-- Supabase SQL Editor에서
-- supabase/migrations/00001_init.sql 내용 전체 실행
```

이후 `npm run seed`로 데모 데이터 생성. 시드는 upsert 기반이라 여러 번 실행해도 안전.
