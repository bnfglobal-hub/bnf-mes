# 배포 가이드

## 권장: Vercel + Supabase

1. GitHub 저장소 연결 (Root Directory: `franchise-order`)
2. 환경변수 등록 (.env.example의 모든 키 — service_role/이카운트 키는 서버 변수로만)
3. `vercel.json` 크론 (전송 큐·재고 동기화):
   ```json
   {
     "crons": [{ "path": "/api/cron/ecount?key=CRON_SECRET값", "schedule": "*/2 * * * *" }]
   }
   ```
   > 이카운트 전표 발행이 **10초에 1건** 제한이라 한 번에 3건씩만 처리합니다.
   > 주문이 몰리는 시간대를 감당하려면 **2분 주기**(분당 최대 6건)로 자주 도는 편이 낫습니다.
4. 배포 후 Supabase Auth → URL Configuration에 배포 도메인 추가

## 대안: 사내 PC/서버 (기존 BNF 운영 방식)

```powershell
npm run build
npm run start          # 기본 3000 포트
```

- Windows 작업 스케줄러에 등록:
  - 시스템 시작 시 `npm run start`
  - 10분 주기 `curl "http://localhost:3000/api/cron/ecount?key=..."`
- 외부(가맹점 스마트폰) 접근이 필요하므로 공인 도메인 + HTTPS(예: Cloudflare Tunnel) 필수.
  PWA 설치와 Supabase Auth 쿠키는 HTTPS 환경을 요구합니다.

## 배포 전 체크리스트

- [ ] `npm run typecheck && npm run lint && npm test && npm run build` 통과
- [ ] Supabase migration 적용 + RLS 활성 확인 (`select * from pg_policies` 일부 확인)
- [ ] 데모 계정 비밀번호 전부 변경 (또는 시드 미실행, 실계정만 생성)
- [ ] `CRON_SECRET` 강한 값으로 설정
- [ ] `ECOUNT_MODE` 확인 (운영 전 MOCK로 리허설 권장)
- [ ] docs/SECURITY.md 점검 항목 확인
