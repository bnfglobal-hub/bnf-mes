import { COMPANY_INFO as C } from "./nav";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface-2">
      <div className="mx-auto max-w-[1180px] px-5 py-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="text-[12.5px] leading-[2] text-muted">
            <p>
              상호: {C.name} <span className="mx-1.5 text-line-strong">|</span>
              대표: {C.ceo} <span className="mx-1.5 text-line-strong">|</span>
              개인정보관리책임자: {C.privacyOfficer}{" "}
              <span className="mx-1.5 text-line-strong">|</span>
              전화: <span className="tabular-nums">{C.tel}</span>{" "}
              <span className="mx-1.5 text-line-strong">|</span>
              이메일: 무단수집거부
            </p>
            <p>
              주소: {C.hq.label}:{C.hq.addr} {C.factory.label}:{C.factory.addr}{" "}
              <span className="mx-1.5 text-line-strong">|</span>
              사업자등록번호: <span className="tabular-nums">{C.bizNo}</span>{" "}
              <span className="mx-1.5 text-line-strong">|</span>
              통신판매: {C.mailOrderNo}
            </p>
            <p className="mt-3 flex gap-4 text-[12px]">
              <a href="/terms" className="hover:text-ink">이용약관</a>
              <a href="/privacy" className="hover:text-ink">개인정보처리방침</a>
              <a
                href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=1208643118"
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink"
              >
                사업자정보확인
              </a>
            </p>
          </div>

          <a
            href="/support/oem"
            className="shrink-0 text-[12px] font-bold tracking-[0.15em] text-muted transition-colors hover:text-brand"
          >
            CONTACT
          </a>
        </div>
      </div>
    </footer>
  );
}
