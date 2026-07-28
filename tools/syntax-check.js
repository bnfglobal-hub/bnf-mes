#!/usr/bin/env node
/*
 * HTML 안의 <script> 블록 문법 검사기
 *   사용: node tools/syntax-check.js [파일...]   (기본: index.html shipping.html)
 *   git pre-commit 훅이 커밋 전에 자동 실행 — 문법 오류가 있으면 커밋이 막힌다.
 *   (2026-07-28 문자열 안 실제 개행으로 사이트 전체가 빈 화면이 됐던 사고 재발 방지)
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const os = require('os');

const targets = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['index.html', 'shipping.html'].filter(f => fs.existsSync(f));

let failed = false;

for (const file of targets) {
  const html = fs.readFileSync(file, 'utf8');
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, idx = 0;
  while ((m = re.exec(html)) !== null) {
    idx++;
    const code = m[1];
    if (!code.trim()) continue;
    // 스크립트가 HTML 몇 번째 줄에서 시작하는지 (오류 줄 번호 환산용)
    const startLine = html.slice(0, m.index + m[0].indexOf(m[1])).split('\n').length;
    const tmp = path.join(os.tmpdir(), 'bnf-syntax-' + process.pid + '-' + idx + '.js');
    fs.writeFileSync(tmp, code, 'utf8');
    const r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
    fs.unlinkSync(tmp);
    if (r.status !== 0) {
      failed = true;
      // node 오류 메시지의 줄 번호를 HTML 기준으로 환산
      const msg = (r.stderr || '').replace(new RegExp(tmp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), file)
        .replace(/:(\d+)(?=\n|:)/, (s, ln) => ':' + (parseInt(ln, 10) + startLine - 1));
      console.error('✕ ' + file + ' — <script> #' + idx + ' (HTML ' + startLine + '번째 줄 시작) 문법 오류:\n');
      console.error(msg.split('\n').slice(0, 12).join('\n'));
    } else {
      console.log('✓ ' + file + ' <script> #' + idx + ' (' + code.length.toLocaleString() + '자) OK');
    }
  }
}

if (failed) {
  console.error('\n⛔ 문법 오류가 있어 커밋을 중단합니다. 위 위치를 고친 뒤 다시 커밋하세요.');
  process.exit(1);
}
console.log('✅ 모든 스크립트 문법 정상');
