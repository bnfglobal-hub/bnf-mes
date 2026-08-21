import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-black/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-[5px] bg-brand text-[13px] font-black text-white">
              B
            </span>
            <span className="display display-slant text-[15px] text-ink">B&amp;F GLOBAL</span>
          </div>
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted">
            고객의 식탁에 오르는 모든 식재료는
            <br />
            건강하고 신뢰할 수 있어야 합니다.
          </p>
        </div>

        <div className="text-[13px] leading-loose text-muted">
          <h2 className="kicker mb-2">Contact</h2>
          <p>
            본사 — 경기도 하남시 산곡로 8
            <br />
            T. 031-794-5071 · F. 031-794-5009
          </p>
          <p className="mt-3">
            제조공장 — 경기도 이천시 백사면 이여로 260-15
            <br />
            T. 031-633-1518 · F. 031-634-6454
          </p>
          <p className="mt-3">대표번호 1688-3362</p>
        </div>

        <div className="text-[13px] leading-loose text-muted">
          <h2 className="kicker mb-2">Company</h2>
          <ul>
            <li><Link href="/company" className="hover:text-ink">회사소개 · 연혁 · 인증</Link></li>
            <li><Link href="/business" className="hover:text-ink">사업분야</Link></li>
            <li><Link href="/products" className="hover:text-ink">제조품목</Link></li>
            <li><Link href="/contact" className="hover:text-ink">OEM 견적 · 오시는 길</Link></li>
            <li>
              <a href="https://smartstore.naver.com/bnfglobal" target="_blank" rel="noreferrer" className="hover:text-ink">
                네이버 스마트스토어 ↗
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-5 text-[11.5px] leading-relaxed text-faint">
          상호 ㈜비엔에프글로벌 · 대표 이용재 · 사업자등록번호 120-86-43118 · 통신판매업
          제2013-경기하남-0052호
          <br />© {new Date().getFullYear()} B&amp;F GLOBAL Co., Ltd. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
