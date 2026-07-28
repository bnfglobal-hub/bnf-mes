# PRODUCT.md — B&F Global MES

## What this is
㈜비엔에프글로벌(식품 제조사, 이천공장)의 사내 통합 인트라넷 + MES.
단일 index.html(React CDN, no build)로 GitHub Pages에 배포되고 데이터는 Supabase에 저장된다.

## Who uses it
- 대표(관리자): 매출·매입·재무·설비·전 직원 업무를 한눈에 본다. 모바일(폰) 사용 비중 높음.
- 일반 직원(사무·생산·연구): 재고, 생산계획, 출고, 전자결재, 작업지시서, 품질기록 등 일 업무 처리.
- 환경: 사무실 PC(밝은 조명) + 현장 모바일. 라이트 테마 고정.

## Jobs to be done
1. 오늘의 숫자(매출·재고 부족·결재 대기·점검 도래)를 홈에서 3초 안에 파악
2. 반복 업무(발주 체크, 출고 계획, 결재, 기록 입력)를 최소 클릭으로
3. 이카운트 ERP에서 자동 수집된 데이터를 신뢰할 수 있게 표시 (숫자 정확성 최우선)

## Surface mode
Operate. 도구는 업무 뒤로 사라져야 한다. 과시적 연출 금지, 밀도와 스캔 가능성 우선.

## Hard constraints
- 단일 HTML 파일, React.createElement(R) 방식, 빌드 없음
- 기존 오렌지 브랜드 컬러(#D94F1E 계열)는 사용자가 고정함 — 바꾸지 않는다
- 한국어 UI, 직원 다수가 IT 비숙련 — 표준 어포던스 유지
- push = 즉시 라이브 배포. 커밋 전 tools/syntax-check.js 필수
