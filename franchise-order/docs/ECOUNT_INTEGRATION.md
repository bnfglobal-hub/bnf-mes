# 이카운트 ERP 연동

## 읽기와 쓰기 분리

| 구분 | 환경변수 | 동작 |
|---|---|---|
| 품목·재고 **조회** | `ECOUNT_READ_ENABLED=true` | 실제 이카운트에서 조회 (데이터 변경 없음) |
| 전표 **발행** | `ECOUNT_MODE=REAL` + `ECOUNT_SYNC_ENABLED=true` | 실제 주문서/판매 전표 발행 |

조회만 먼저 켜서 품목·재고를 맞춘 뒤, 전표 발행을 나중에 켜는 단계적 전환이 가능합니다.
관리자 → 상품관리 → **이카운트 품목 가져오기**로 품목 마스터를 내부 상품으로 동기화합니다
(신규 등록 + 품명 갱신, 내부 단가가 0일 때만 이카운트 판매단가를 채움 — 운영 단가를 덮어쓰지 않음).

> 과세구분(VAT_YN)은 이카운트에서 "단가 부가세 포함 여부"와 혼용되어 의미가 모호하므로
> 자동 매핑하지 않고 **기본 과세**로 등록합니다. 면세 품목은 상품 수정에서 조정하세요.

## 현재 상태

- **Mock 모드 완성**: 전체 주문 흐름(확정 → 큐 → 전송 → 전표번호 기록 → 실패/재시도/수동확인)이
  실제 이카운트 없이 동작합니다.
- **Real 클라이언트는 골격만 구현**: Zone 조회 → 로그인(SESSION_ID) 흐름은 작성되어 있으나,
  주문서입력/재고조회/품목조회의 **요청·응답 필드 매핑은 공식 문서 확인 후 채워야 합니다.**
  API 필드를 추측으로 구현하지 않는다는 원칙에 따라 의도적으로 비워 두었습니다
  (`src/lib/ecount/real-client.ts`의 TODO).

## 관리자가 준비해야 할 것

1. 이카운트 로그인 → **Self-Customizing > 정보관리 > API 인증키 발급** (또는 이카운트 고객센터 문의)
   - 회사코드 (COM_CODE)
   - API 사용자 ID (USER_ID)
   - API 인증키 (API_CERT_KEY)
2. 이카운트 Open API 공식 매뉴얼 (https://open.ecount.com 또는 sboapi 문서)
   - 주문서입력(SaveSaleOrder), 판매입력(SaveSale), 재고현황조회, 품목조회 스펙
3. 기준정보 매핑 확인
   - 가맹점별 **거래처코드** → `stores.ecount_customer_code`
   - 상품별 **품목코드** → `products.ecount_item_code`
   - **창고코드** → `warehouses.code` (기본값: `ECOUNT_DEFAULT_WAREHOUSE_CODE`)

## 전환 절차

1. `.env.local`:
   ```
   ECOUNT_MODE=REAL
   ECOUNT_SYNC_ENABLED=true
   ECOUNT_COMPANY_CODE=회사코드
   ECOUNT_API_USER_ID=API사용자ID
   ECOUNT_API_KEY=인증키
   ECOUNT_API_BASE_URL=https://oapi.ecount.com   # 테스트는 https://sboapi.ecount.com
   ECOUNT_DEFAULT_WAREHOUSE_CODE=창고코드
   ```
2. `src/lib/ecount/real-client.ts`
   - `pushOrder()`: 공식 문서의 주문서입력 요청 스키마에 `EcountOrderPayload`를 매핑
     - 반드시 **비고/자사관리 필드에 내부 주문번호(BNF-...)를 기록** → `findOrderByKey` 중복 확인에 사용
   - `fetchStocks()`: 재고현황조회 응답을 `{itemCode, warehouseCode, qty}`로 매핑
   - `fetchItems()`: 품목조회 응답 매핑
   - `findOrderByKey()`: 주문 조회 API에서 비고=주문번호 검색
3. 관리자 → 이카운트 연동 → **연결 테스트** (Zone 조회 + 로그인 확인)
4. 테스트 주문 1건 확정 → 전송 큐 실행 → 이카운트에서 전표 확인

## 안전장치 (구현 완료)

| 항목 | 구현 |
|---|---|
| 주문 유실 방지 | DB 저장 성공 후에만 큐 등록, ERP 실패와 주문 상태 분리 |
| 중복 등록 방지 | 주문번호 기반 idempotency key (unique), 재시도 전 기존 등록 조회 |
| 타임아웃 처리 | `indeterminate` 결과 → 재전송 금지, `MANUAL_REVIEW` 전환 |
| 재시도 | 지수 백오프 1→2→4→8→16분, 최대 5회 후 수동확인 |
| 수동 재전송 | 관리자 화면 재전송 버튼 (attempts 리셋) |
| 민감정보 | 요청/응답 로그에서 key/password/session 마스킹 (`maskSensitive`) |
| 감사 | ecount_sync_logs에 REQUEST/RESPONSE 기록 |
| 검증 | 전송 전 거래처코드/품목코드 존재 확인, 없으면 오류 메시지와 함께 실패 처리 |

## 재고 동기화

- `syncStocks()`가 이카운트 재고를 `inventory_snapshots`에 upsert (품목×창고)
- 화면에 항상 "최종 재고 반영: YYYY-MM-DD HH:mm" 표시
- 판매가능재고 = 현재고 − 미해제 예약수량(확정 주문) − 안전재고
- 가맹점 노출 방식은 시스템 설정에서 선택: 정확한 숫자 / 충분·부족·품절 / 품절만 / 숨김

## 주문서입력 vs 판매입력 정책

- 기본: 주문 확정 시 **주문서입력**
- `ecount_connections.order_input_policy = 'SALE'` 또는 출고 완료 시 판매입력을 쓰려면
  `changeOrderStatus`의 SHIPPED 분기에서 `pushSale` 큐 등록을 활성화 (확장 지점 주석 참조)
