# -*- coding: utf-8 -*-
"""전 메뉴 백지화면 검사 (커밋 전 자동 실행)
   실제 브라우저(헤드리스)로 index.html을 열고 관리자 계정으로 모든 페이지를
   순회하며, 화면이 비거나 자바스크립트 오류가 나면 커밋을 막는다.
   사용: python tools/smoke-test.py
"""
import http.server
import io
import os
import re
import socket
import socketserver
import sys
import threading

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# index.html에서 라우팅된 페이지 id를 전부 추출한다 (새 메뉴가 생겨도 자동 포함)
html = io.open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
PAGES = sorted(set(re.findall(r"page==='([A-Za-z_0-9]+)'", html)))

def free_port():
    s = socket.socket()
    s.bind(('127.0.0.1', 0))
    p = s.getsockname()[1]
    s.close()
    return p


def main():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print('(!) playwright 미설치 — 백지화면 검사 건너뜀')
        return 0

    port = free_port()
    os.chdir(ROOT)
    handler = http.server.SimpleHTTPRequestHandler
    handler.log_message = lambda *a, **k: None
    srv = socketserver.TCPServer(('127.0.0.1', port), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    bad = []
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        pg = b.new_page(viewport={'width': 1500, 'height': 900})
        errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)[:120]))
        pg.goto('http://127.0.0.1:%d/index.html' % port, wait_until='domcontentloaded')
        pg.evaluate("() => localStorage.setItem('bnf_user', JSON.stringify({id:'smoke', name:'점검용', role:'superadmin', position:'점검', email:'smoke@test'}))")
        pg.reload(wait_until='domcontentloaded')
        pg.wait_for_timeout(5000)
        body = pg.evaluate('() => document.body.innerText')
        if '점검용' not in body:
            print('X 로그인 주입 실패 — 검사 불가 (수동 확인 필요)')
            b.close()
            srv.shutdown()
            return 1
        for pid in PAGES:
            errors.clear()
            pg.evaluate("(p) => { history.pushState({bnfPage:p},''); window.dispatchEvent(new PopStateEvent('popstate',{state:{bnfPage:p}})); }", pid)
            pg.wait_for_timeout(450)
            info = pg.evaluate("""() => {
              const r = document.getElementById('root');
              return { empty: !r || !r.firstChild || r.innerText.trim().length < 10 };
            }""")
            if info['empty'] or errors:
                bad.append('%s%s' % (pid, (' :: ' + errors[0]) if errors else ' :: 화면이 비어 있음'))
        b.close()
    srv.shutdown()

    if bad:
        print('X 백지화면 검사 실패 %d건 — 커밋이 차단되었습니다' % len(bad))
        for x in bad:
            print('   - ' + x)
        return 1
    print('OK 백지화면 검사 통과 (%d개 페이지)' % len(PAGES))
    return 0


if __name__ == '__main__':
    sys.exit(main())
