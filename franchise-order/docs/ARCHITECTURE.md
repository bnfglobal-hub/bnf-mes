# 아키텍처

## 전체 구성

```
[가맹점 스마트폰 PWA]        [본사 관리자 PC/모바일]
        │                          │
        └────────── Next.js 16 ────┘
             │ Server Components + Server Actions
             │  · 모든 금액/수량/권한을 서버에서 재검증
             ▼
        Supabase (PostgreSQL + Auth + RLS)
             │
             ▼
   ecount_sync_jobs (전송 큐, idempotency key)
             │  지수 백오프 재시도 / 수동 재전송
             ▼
        EcountClient (MOCK ↔ REAL 전환)
             ▼
        이카운트 Open API (주문서 입력 / 재고 조회)
```

## 핵심 설계 원칙

1. **주문은 내부 DB 우선.** 주문 저장이 성공한 뒤에야 ERP 전송 큐에 등록한다.
   이카운트 장애가 나도 주문은 유실되지 않고, 큐가 재시도한다.
2. **중복 방지 2중.**
   - 클라이언트 중복 제출: `orders.client_request_id` unique → 같은 요청은 기존 주문 반환(멱등)
   - ERP 중복 등록: `idempotency_key`(주문번호 기반) unique + 재시도 전 `findOrderByKey` 조회
   - 타임아웃 등 성공 불명확 시 재전송하지 않고 `MANUAL_REVIEW` 상태로 전환
3. **가격은 서버가 결정.** 클라이언트 표시는 참고용, `placeOrder()`가 단가/VAT/배송비/최소금액을 재계산.
4. **스냅샷 보존.** 주문 시점의 품명·단가·배송지를 `order_items.product_snapshot`, `orders.ship_to`에 저장.
5. **권한 3중.** Proxy(낙관적) → 서버 `requireRole()` → Supabase RLS(최종 방어선).

## 주문 상태 기계

```
DRAFT → PENDING → CONFIRMED → PICKING → PICKED → SHIPPED → DELIVERED
           │           │                    └→ PARTIALLY_SHIPPED ↗
           │           └→ CANCELLED
           ├→ REJECTED
           └→ CANCEL_REQUESTED → CANCELLED / CONFIRMED(거부)
```

전이 규칙은 `src/lib/domain/order-service.ts`의 `canTransition()` 한 곳에서만 정의.
ERP 상태(`NOT_READY→QUEUED→SYNCING→SUCCESS/FAILED/RETRYING/MANUAL_REVIEW`)는 주문 상태와 독립.

## 출고일 계산

`src/lib/domain/delivery-date.ts` — 순수 함수, 유닛테스트 포함.
마감시간(가맹점별) + 최소 리드타임 + 본사 출고요일 ∩ 가맹점 배송요일 + 휴무일 회피.

## 알림

`src/lib/notify.ts` — 인앱 알림(notifications 테이블) + Provider 추상화.
외부 채널(알림톡/SMS/이메일)은 `NotificationProvider` 구현 추가로 확장, 현재 MockProvider가 notification_logs에 기록.
