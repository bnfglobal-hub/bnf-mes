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

/* ── 3-b) 원료 발주 · 통합 소요량 합산/금액/정렬 (2026-11-17) ── */
{
  const code = extract('function bnfReqUnit(u)', "return bnfReqUnit(a.unit).localeCompare(bnfReqUnit(b.unit))||d*((+a[k]||0)-(+b[k]||0))||nm(a,b);\n  });\n}");
  const { bnfCombineReq, bnfReqEst, bnfSortReq } = new Function(code + '\nreturn {bnfCombineReq,bnfReqEst,bnfSortReq};')();
  const mats = [
    { c: 'M1', n: '된장', u: 'kg', s: 169.1 },
    { c: 'M2', n: '설탕', u: 'kg', s: 0 },
    { c: 'M3', n: '설탕', u: 'kg', s: 50 },      /* 이름 같고 코드 다름 */
    { c: 'M4', n: '소금', u: 'kg', s: -12.5 },   /* 음수 재고 */
    { c: 'M6', n: '고춧가루', u: 'kg' },          /* 재고값 비어 있음 */
  ];
  const prods = [
    { id: 'A', name: '제품A', bom: [{ c: 'M1', amt: 0.1, unit: 'kg' }, { c: 'M2', amt: 1, unit: 'kg' }, { c: 'M4', amt: 0.5 }, { c: 'M5', name: '미등록원료', amt: 2, unit: 'ea' }, { c: 'M6', amt: 0.2, unit: 'kg' }] },
    { id: 'B', name: '제품B', bom: [{ c: 'M1', amt: 0.2, unit: 'kg' }, { c: 'M3', amt: 1, unit: 'kg' }, { c: 'M6', amt: 200, unit: 'g' }] },
    { id: 'C', name: '제품C', bom: [{ c: 'M1', amt: 1 }] },
  ];
  eq('제품 1개면 통합 없음', bnfCombineReq(prods, { A: '3' }, mats), null);
  const r = bnfCombineReq(prods, { A: '1000', B: '1000', C: '' }, mats);
  const by = c => r.rows.find(x => x.code === c);
  eq('수량 입력 제품만 집계', r.prodCount, 2);
  eq('같은 코드 병합 + 소수점 오차 정리 (0.1·1000+0.2·1000)', by('M1').needed, 300);
  eq('같은 코드 병합: 사용 제품 2개', by('M1').prods.map(x => x.name), ['제품A', '제품B']);
  eq('제품별 소요 추적', by('M1').prods.map(x => x.needed), [100, 200]);
  eq('부족 수량 양수 (300-169.1)', by('M1').short, 130.9);
  eq('같은 이름 다른 코드는 따로', [by('M2').needed, by('M3').needed], [1000, 1000]);
  eq('재고 0 → 부족 = 필요량', by('M2').short, 1000);
  eq('재고 충분 → 부족 0 (음수 아님)', bnfCombineReq(prods, { A: '1', B: '1' }, mats).rows.find(x => x.code === 'M3').short, 0);
  eq('음수 재고 → 부족 = 필요 − 재고', by('M4').short, 512.5);
  eq('미등록 품목 표시 + 재고 0', [by('M5').noMat, by('M5').stock, by('M5').short], [true, 0, 2000]);
  eq('재고값 비어 있으면 NaN 아닌 0', by('M6').stock, 0);
  eq('단위 혼재 플래그 (kg+g)', [by('M6').unitMix, by('M1').unitMix], [true, false]);
  eq('BOM 단위 ≠ 재고 단위 플래그 (BOM ea · 재고 kg)', bnfCombineReq([{ id: 'X', name: 'X', bom: [{ c: 'M1', amt: 2, unit: 'ea' }] }, { id: 'Y', name: 'Y', bom: [{ c: 'M2', amt: 1, unit: 'kg' }] }], { X: '1', Y: '1' }, mats).rows.map(x => [x.code, x.unitMis]).sort(), [['M1', true], ['M2', false]]);
  eq('BOM 단위 비어 있으면 재고 단위 사용 → 불일치 아님', by('M4').unitMis, false);
  eq('부족 품목 수', r.shortCount, r.rows.filter(x => x.short > 0).length);

  eq('예상금액 계산', bnfReqEst(384.3, 1725, 1700, false), { est: 662918, warn: '' });
  eq('예상금액: 충분하면 0', bnfReqEst(0, 1725, 0, false), { est: 0, warn: '' });
  eq('예상금액: 단가 없음', bnfReqEst(5, 0, 0, false), { est: null, warn: 'noprice' });
  eq('예상금액: 단위 혼재 제외', bnfReqEst(5, 100, 0, true), { est: null, warn: 'unit' });
  eq('예상금액: 재고단가와 5배 이상 차이 → 단위 의심', bnfReqEst(5, 34500, 1725, false), { est: null, warn: 'ratio' });
  eq('예상금액: 큰 금액 정수', bnfReqEst(1839, 250, 0, false).est, 459750);

  const rows = [
    { code: 'K1', name: '나', unit: 'kg', short: 5, needed: 10, stock: 5 },
    { code: 'K2', name: '가', unit: 'ea', short: 900, needed: 900, stock: 0 },
    { code: 'K3', name: '다', unit: 'kg', short: 50, needed: 60, stock: 10 },
  ];
  const sup = { K1: '을', K2: '', K3: '갑' };
  eq('기본 정렬: 매입처 있는 것 먼저·매입처 이름순', bnfSortReq(rows, null, x => sup[x.code]).map(x => x.code), ['K3', 'K1', 'K2']);
  eq('이름 오름차순', bnfSortReq(rows, { k: 'name', d: 'asc' }).map(x => x.code), ['K2', 'K1', 'K3']);
  eq('부족 내림차순: 단위별로 묶어 비교 (ea 900을 kg와 섞지 않음)', bnfSortReq(rows, { k: 'short', d: 'desc' }).map(x => x.code), ['K2', 'K3', 'K1']);
  const est = { K1: 1000, K2: null, K3: 50 };
  eq('금액 내림차순, 금액 없음은 맨 뒤', bnfSortReq(rows, { k: 'est', d: 'desc' }, null, x => est[x.code]).map(x => x.code), ['K1', 'K3', 'K2']);
  eq('금액 오름차순, 금액 없음은 맨 뒤', bnfSortReq(rows, { k: 'est', d: 'asc' }, null, x => est[x.code]).map(x => x.code), ['K3', 'K1', 'K2']);
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

/* ── 안전관리: 다음 예정일·상태 계산 (safetyStatus) ── */
{
  const code = extract('function safetyStatus(def,cfg,logs,today){', "return{st:'ok',label:'정상',last,next,left,cyc};\n}");
  const safetyStatus = new Function(code + '\nreturn safetyStatus;')();
  const T = new Date('2026-11-17T09:00:00');
  const D = { k: 'a', cycleM: 12 };
  eq('기록 없음', safetyStatus(D, null, [], T).st, 'none');
  eq('해당 없음 우선', safetyStatus(D, { na: true }, [{ k: 'a', date: '2020-01-01' }], T).st, 'na');
  eq('발생 시 항목', safetyStatus({ k: 'a', cycleM: 0 }, null, [], T).st, 'event');
  eq('매년: 다음 예정일', safetyStatus(D, null, [{ k: 'a', date: '2026-03-10' }], T).next, '2027-03-10');
  eq('최근 기록 기준(여러 건)', safetyStatus(D, null, [{ k: 'a', date: '2025-01-01' }, { k: 'a', date: '2026-03-10' }, { k: 'b', date: '2026-11-01' }], T).last, '2026-03-10');
  eq('지남', safetyStatus(D, null, [{ k: 'a', date: '2025-11-10' }], T).st, 'over');
  eq('지남 일수', safetyStatus(D, null, [{ k: 'a', date: '2025-11-10' }], T).left, -7);
  eq('30일 이내', safetyStatus(D, null, [{ k: 'a', date: '2025-12-10' }], T).st, 'soon');
  eq('당일 = 30일 이내(0일)', safetyStatus(D, null, [{ k: 'a', date: '2025-11-17' }], T).left, 0);
  eq('주기 변경(6개월) 반영', safetyStatus(D, { cycleM: 6 }, [{ k: 'a', date: '2026-03-10' }], T).st, 'over');
  eq('주기 0으로 변경 → 발생 시', safetyStatus(D, { cycleM: 0 }, [{ k: 'a', date: '2026-03-10' }], T).st, 'event');
}

console.log(failures === 0
  ? '✅ 로직 테스트 통과 (' + passes + '건)'
  : '❌ 로직 테스트 실패 ' + failures + '건 / 통과 ' + passes + '건');
process.exit(failures === 0 ? 0 : 1);
