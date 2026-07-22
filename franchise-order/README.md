# BNF 프랜차이즈 물류 — 가맹점 발주·물류 관리 시스템

㈜비엔에프글로벌의 외식 프랜차이즈 가맹점 발주를 하나의 시스템으로 통합합니다.
가맹점은 스마트폰(PWA)으로 발주하고, 본사는 주문 확정 → 피킹 → 출고 → 배송을 관리하며,
확정된 주문은 이카운트 ERP 주문서 입력으로 자동 전송됩니다.

## 기술 스택

- Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4
- Supabase (PostgreSQL, Auth, RLS)
- Zod 서버 검증 · React Server Components + Server Actions
- Vitest (단위) · Playwright (E2E) · PWA (manifest + Service Worker)

## 폴더 구조

```
franchise-order/
├─ supabase/migrations/00001_init.sql   # 전체 스키마 + RLS + 기본 데이터
├─ scripts/seed.ts                      # 데모 데이터 시드
├─ src/
│  ├─ proxy.ts                          # 세션 갱신 + 라우트 가드 (Next16 Proxy)
│  ├─ app/
│  │  ├─ login/                         # 아이디/비밀번호 로그인
│  │  ├─ app/                           # 가맹점 모바일 (홈·상품·장바구니·주문·마이)
│  │  ├─ admin/                         # 본사 관리자 (대시보드~감사로그)
│  │  └─ api/cron/ecount/               # 전송 큐·재고 동기화 크론 엔드포인트
│  └─ lib/
│     ├─ domain/                        # 순수 도메인 로직 (가격·출고일·주문)
│     ├─ ecount/                        # EcountClient 인터페이스 + Mock/Real
│     └─ supabase/                      # 클라이언트 (browser/server/admin)
└─ tests/  (unit + e2e)
```

## 설치·실행

### 1) Supabase 프로젝트 준비

1. https://supabase.com 에서 프로젝트 생성
2. SQL Editor에 `supabase/migrations/00001_init.sql` 전체 붙여넣기 실행
   (또는 Supabase CLI: `supabase db push`)
3. Project Settings → API 에서 URL / anon key / service_role key 복사

### 2) 환경변수

```bash
cp .env.example .env.local
```

`.env.local` 필수값:

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (서버 전용, 절대 노출 금지) |
| `ECOUNT_MODE` | `MOCK`(기본) / `REAL` |
| `ECOUNT_SYNC_ENABLED` | `true`일 때만 REAL 전송 |
| `CRON_SECRET` | 크론 엔드포인트 보호용 임의 문자열 |

### 3) 시드 + 실행

```bash
npm install
npm run seed        # 데모 브랜드/가맹점/상품/계정 생성
npm run dev         # http://localhost:3000
```

### 데모 계정

| 아이디 | 비밀번호 | 역할 |
|---|---|---|
| admin | admin1234! | 최고 관리자 |
| hq | hq1234! | 본사 관리자 |
| wh | wh1234! | 창고 담당 |
| gangnam / hanam / seongsu | store1234! | 각 가맹점 점주 |

가맹점마다 취급상품과 단가가 다르게 시드됩니다 (예: 냉면육수는 강남·하남만, 강남은 1,700원 전용단가).

## 테스트·빌드

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm test            # Vitest 단위 테스트 (가격·VAT·출고일·상태전이·백오프·마스킹 등)
npm run test:e2e    # Playwright E2E (Supabase + seed 완료 후)
npm run build       # 프로덕션 빌드
```

## Mock ECOUNT 사용법

기본값(`ECOUNT_MODE=MOCK`)에서는 실제 이카운트에 아무것도 전송되지 않습니다.

1. 관리자 → 주문관리에서 주문 **확정** → 전송 큐(QUEUED) 등록
2. 관리자 → 이카운트 연동 → **전송 큐 지금 실행** → Mock 전표번호(`MOCK-YYYYMMDD-0001`) 발급
3. **Mock 실패 시뮬레이션** 버튼으로 실패→지수 백오프 재시도→수동 재전송 흐름 테스트
4. 같은 주문을 다시 전송해도 같은 전표번호가 반환됩니다 (idempotency 재현)

## 실제 이카운트 연동 전환

`docs/ECOUNT_INTEGRATION.md` 참고. 요약:

1. 이카운트에서 Open API 인증키 발급 (회사코드 / API 사용자 ID / 인증키)
2. `.env.local`에 `ECOUNT_*` 값 입력, `ECOUNT_MODE=REAL`, `ECOUNT_SYNC_ENABLED=true`
3. `src/lib/ecount/real-client.ts`의 TODO 지점에 공식 문서 기준 필드 매핑 완성
4. 관리자 → 이카운트 연동 → 연결 테스트로 확인

## 주기 실행 (전송 큐·재고 동기화)

`GET /api/cron/ecount?key=<CRON_SECRET>` 를 5~10분 주기로 호출:

- Vercel 배포 시 `vercel.json`의 crons 사용
- 사내 PC 운영 시 Windows 작업 스케줄러에서 `curl` 호출

## PWA 설치

가맹점 스마트폰 브라우저(크롬/사파리)에서 접속 → "홈 화면에 추가".
standalone 모드, 주황 테마, 오프라인 안내 페이지가 포함되어 있습니다.
오프라인에서는 주문 확정이 불가능하며(네트워크 필수), 네트워크 복구 시 자동 재시도 안내가 표시됩니다.

## 문서

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 구조·데이터 흐름
- [docs/DATABASE.md](docs/DATABASE.md) — 테이블·RLS 설계
- [docs/ECOUNT_INTEGRATION.md](docs/ECOUNT_INTEGRATION.md) — 이카운트 연동 상세
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — 배포 가이드
- [docs/OPERATIONS.md](docs/OPERATIONS.md) — 일상 운영 매뉴얼
- [docs/SECURITY.md](docs/SECURITY.md) — 보안 점검사항
