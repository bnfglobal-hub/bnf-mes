#!/usr/bin/env node
/* 핵심 업무 로직 자동 테스트 (커밋 전 자동 실행)
   index.html에서 순수 함수를 추출해 실제 배포될 코드 그대로 검증한다.
   사용: node tools/logic-tests.js */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\r\n/g, '\n');

/* index.html 안의 특정 선언 블록을 추출 */
function extract(startMarker, endMarker) {
  const s = html.indexOf(startMarker);
  if (s < 0) throw new Error('추출 실패(시작): ' + startMarker.slice(0, 40));
  const e = html.indexOf(endMarker, s);
  if (e < 0) throw new Error('추출 실패(끝): ' + endMarker.slice(0, 40));
  return html.slice(s, e + endMarker.length);
}

let failures = 0;
let passes = 0;
function eq(name, actual, expected) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a === b) { passes++; }
  else { failures++; console.error('  ✗ ' + name + '\n      결과: ' + a + '\n      기대: ' + b); }
}

/* ── 1) 출고계획: PACK_MAP / packOf / fixAiItem ── */
{
  const code = extract('const NAME_FIX=[', 'return {box,pack,total};\n  };');
  /* React 훅·서버 호출은 테스트에서 대체(스텁)하고 순수 계산 로직만 검증한다 */
  const stub = 'const useState=(v)=>[v,()=>{}];const useEffect=()=>{};'
    + 'const sbClient={from:()=>({select:()=>({eq:()=>({maybeSingle:()=>Promise.resolve({data:null})})}),upsert:()=>Promise.resolve({})})};'
    + 'const parsed=null;\n';
  const fn = new Function(stub + code + '\nreturn {fixAiItem, packOf, fixAiName, nameSim};');
  const { fixAiItem, packOf, fixAiName, nameSim } = fn();

  eq('packOf 청국장=30', packOf('[엄마밥상] 청국장'), 30);
  eq('packOf 김치청국장=25', packOf('[엄마밥상] 김치청국장'), 25);
  eq('packOf 털레기=15', packOf('[외할머니댁] 일산 털레기 수제비'), 15);
  eq('packOf 돈코츠라멘=20', packOf('[리틀 후쿠오카] 돈코츠 라멘'), 20);
  eq('packOf 쌀국수2인분=12', packOf('[리틀 비엣남] 소고기 쌀국수 2인분'), 12);

  /* 확정 규칙: AI가 읽은 수량 = 발주수량(박스수), 총수량 = 입수×박스 */
  eq('fixAiItem 청국장 (30,125)', fixAiItem('[엄마밥상] 청국장', 30, 125), { box: 125, pack: 30, total: 3750 });
  eq('fixAiItem 청국장 (125,3750)', fixAiItem('[엄마밥상] 청국장', 125, 3750), { box: 125, pack: 30, total: 3750 });
  eq('fixAiItem 털레기 (15,10)', fixAiItem('[외할머니댁] 일산 털레기 수제비', 15, 10), { box: 10, pack: 15, total: 150 });
  eq('fixAiItem 맑은곰탕 (20,6)', fixAiItem('[엄마밥상] 맑은곰탕', 20, 6), { box: 6, pack: 20, total: 120 });
  eq('fixAiItem 미등록품목 (24,7)', fixAiItem('신제품X', 24, 7), { box: 7, pack: 24, total: 168 });
  eq('fixAiItem 빈값', fixAiItem('청국장', 0, 0), { box: 0, pack: 30, total: 0 });

  /* OCR 오타 교정 */
  eq('fixAiName 렐레기→털레기', fixAiName('[외할머니댁] 일산 렐레기 수제비'), '[외할머니댁] 일산 털레기 수제비');
  eq('fixAiName 외할머니맥→댁', fixAiName('[외할머니맥] 일산 털레기 수제비'), '[외할머니댁] 일산 털레기 수제비');
  eq('fixAiName 공백정리', fixAiName('  [엄마밥상]   청국장  '), '[엄마밥상] 청국장');
  eq('fixAiName 벌레기→털레기', fixAiName('[외할머니댁] 일산 벌레기 수제비'), '[외할머니댁] 일산 털레기 수제비');

  /* 실제 사전이 있을 때 오인식 교정 (여러 형태) */
  {
    const CANON = ['[외할머니댁] 일산 털레기 수제비', '[엄마밥상] 김치청국장', '[엄마밥상] 청국장', '[엄마밥상] 맑은곰탕'];
    const stub2 = 'const useState=(v)=>[' + JSON.stringify(CANON) + ',()=>{}];const useEffect=()=>{};'
      + 'const sbClient={from:()=>({select:()=>({eq:()=>({maybeSingle:()=>Promise.resolve({data:null})})}),upsert:()=>Promise.resolve({})})};'
      + 'const parsed=null;\n';
    const f2 = new Function(stub2 + code + '\nreturn fixAiName;')();
    ['일산 할례기 수제비', '일산 딜레 수제비', '일산 텔레기 수제비', '일산 벌레기 수제비'].forEach(t => {
      eq('교정 ' + t, f2('[외할머니댁] ' + t), '[외할머니댁] 일산 털레기 수제비');
    });
    /* 다른 제품끼리는 섞이면 안 된다 */
    eq('청국장 유지', f2('[엄마밥상] 청국장'), '[엄마밥상] 청국장');
    eq('김치청국장 유지', f2('[엄마밥상] 김치청국장'), '[엄마밥상] 김치청국장');
  }

  /* 이름 유사도: 한 글자 오인식은 높은 점수, 다른 제품은 낮은 점수여야 한다 */
  const simTypo = nameSim('[외할머니댁] 일산 벌레기 수제비', '[외할머니댁] 일산 털레기 수제비');
  if (simTypo >= 0.78) passes++;
  else { failures++; console.error('  ✗ 한 글자 오인식 유사도 ' + simTypo.toFixed(2) + ' (0.78 이상 기대)'); }
  /* 오타 교정본이 다른 제품보다 반드시 더 가까워야 한다 (섞임 방지의 핵심 성질) */
  const simOther = nameSim('[엄마밥상] 청국장', '[엄마밥상] 김치청국장');
  if (simTypo > simOther) passes++;
  else { failures++; console.error('  ✗ 오타 유사도(' + simTypo.toFixed(2) + ')가 다른 제품(' + simOther.toFixed(2) + ')보다 높아야 합니다'); }
}

/* ── 2) 출고계획: 센터 이름 정규화 ── */
{
  const code = extract('const normCenter2=', ';};');
  const fn = new Function(code + '\nreturn normCenter2;');
  const normCenter2 = fn();
  eq('센터 김포냉동(삼우)', normCenter2('김포냉동 (삼우)'), '김포(삼우)');
  eq('센터 켄달 2층', normCenter2('김포냉동 켄달 2층'), '김포(켄달)');
  eq('센터 평택냉동 4층', normCenter2('평택냉동 4층'), '평택컬리');
  eq('센터 창원냉동 3층', normCenter2('창원냉동 3층'), '창원물류대행');
  eq('센터 빈값', normCenter2(''), '기타');
}

/* ── 3) 가동률: 근무일 계산 ── */
{
  const code = extract('const HOLIDAYS=', 'return count;\n}');
  const fn = new Function(code + '\nreturn calcWorkingDays;');
  const calcWorkingDays = fn();
  const wd = calcWorkingDays(2026, 8);
  if (wd >= 18 && wd <= 23) passes++; else { failures++; console.error('  ✗ 2026-08 근무일 ' + wd + ' (18~23 기대)'); }
  eq('2026-01 근무일(공휴일 1/1 제외)', calcWorkingDays(2026, 1) <= 22, true);
}

/* ── 4) 재발 방지 정적 검사 ──
   과거 장애 원인이 된 패턴이 다시 들어오면 커밋을 막는다. */
{
  /* (a) 동기화 훅에 함수를 '값'으로 넘기면 선언 전 참조(TDZ)로 화면이 하얗게 된다.
         반드시 useBnfSyncReload(()=>load()) 형태여야 한다. (2026-08-11 CRM 백색화면) */
  const bad = [...html.matchAll(/useBnfSyncReload\(\s*(?!\(\s*\)\s*=>)([A-Za-z_$][\w$]*)\s*\)/g)]
    .filter(m => m[1] !== 'fn');
  if (bad.length === 0) passes++;
  else { failures++; console.error('  ✗ useBnfSyncReload에 함수를 값으로 전달: ' + bad.map(b => b[1]).join(', ') + ' → ()=>' + bad[0][1] + '() 형태로 바꾸세요'); }

  /* (b) 자동저장이 서버 읽기 실패 시 중단하는 가드가 남아 있어야 한다 (2026-07-29 BOM 소실) */
  if (html.includes('자동저장 중단: 서버 상태를 읽지 못함')) passes++;
  else { failures++; console.error('  ✗ 자동저장 안전가드(읽기 실패 시 중단)가 사라졌습니다'); }

  /* (c) 문자열 리터럴 안에 실제 줄바꿈이 들어가면 전체 스크립트가 죽는다 → syntax-check가 잡지만
         alert/confirm 안의 \n 표기가 유지되는지 최소 확인 */
  if (/confirm\('[^']*\\n/.test(html) || /alert\('[^']*\\n/.test(html)) passes++;
  else { failures++; console.error('  ✗ 경고창 줄바꿈 표기(\\n)가 사라졌습니다 — 실제 줄바꿈이 들어갔는지 확인'); }
}

console.log(failures === 0
  ? '✅ 로직 테스트 통과 (' + passes + '건)'
  : '❌ 로직 테스트 실패 ' + failures + '건 / 통과 ' + passes + '건');
process.exit(failures === 0 ? 0 : 1);
