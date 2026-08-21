import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

/** 일반 페이지 공통 틀 — 머리말과 꼬리말.
 *  관리자 화면(/admin)은 이 틀을 쓰지 않는다. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
