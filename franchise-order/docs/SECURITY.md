# 보안

## 적용된 방어

| 영역 | 구현 |
|---|---|
| 인증 | Supabase Auth (아이디→내부 이메일 매핑), 비활성 계정 로그인 차단 |
| 인가 | 3중: Proxy 리다이렉트 → 서버 `requireRole()` → PostgreSQL RLS |
| RLS | 모든 테이블 활성화. 가맹점은 자기 가맹점 데이터만, 관리자 전용 테이블 분리 |
| 입력 검증 | 모든 Server Action에 Zod 스키마 + 소유권 재확인 (storeId는 세션에서, 클라이언트 값 무시) |
| 금액 변조 | 단가/VAT/배송비/합계를 서버에서 전면 재계산 (`placeOrder`) |
| 중복 주문 | client_request_id unique (멱등), 버튼 연속클릭 가드 |
| Rate limit | 로그인 10회/분/IP, 주문 5회/분/사용자 (`src/lib/rate-limit.ts` — 다중 인스턴스 시 Redis로 교체) |
| SQL Injection | Supabase 파라미터 바인딩 (raw query 없음) |
| XSS | React 이스케이프 + 사용자 입력을 dangerouslySetInnerHTML에 사용하지 않음 |
| CSRF | Next.js Server Actions 내장 origin 검증 + SameSite 쿠키 |
| 비밀 관리 | 이카운트/서비스 키는 서버 환경변수만. `server-only` import로 클라이언트 번들 유입 시 빌드 실패 |
| 로그 마스킹 | ERP 요청/응답 로그에서 key/password/session/token 자동 마스킹 |
| 감사 | 주문 수정·상태 변경·상품/가맹점/사용자 변경 모두 audit_logs (누가·언제·무엇을·전후값) |
| 에러 노출 | 사용자에게는 한국어 안내만, 스택/내부정보 미노출 (Next 프로덕션 기본) |

## 운영 전 점검 체크리스트

- [ ] 데모 계정(admin/hq/wh/가맹점) 비밀번호 전량 변경 또는 삭제
- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 클라이언트/저장소에 없는지 확인 (`.env.local`은 gitignore)
- [ ] Supabase Auth → 이메일 가입 비활성화 (계정은 관리자 생성만)
- [ ] `CRON_SECRET` 설정 및 크론 URL 외부 유출 주의
- [ ] HTTPS 강제 (Vercel 기본 / 자체 호스팅 시 필수 구성)
- [ ] Supabase 대시보드 접근 계정 2FA
- [ ] 이카운트 API 키 권한 최소화 (주문/재고 관련만)
- [ ] 정기 백업 확인

## 알려진 한계 / 후속 권장

- rate limiter가 인메모리 → 다중 인스턴스 배포 시 Upstash Redis 등으로 교체
- 파일 업로드(클레임 사진, 공지 첨부)는 스키마·필드만 준비됨 → Supabase Storage 버킷 + 확장자/MIME/크기 검증 로직 추가 필요
- 이카운트 인증정보는 DB가 아닌 환경변수로만 저장 (DB 저장이 필요해지면 서버 전용 암호화 필수)
