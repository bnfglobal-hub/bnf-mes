import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "㈜비엔에프글로벌 — B&F GLOBAL",
    template: "%s | ㈜비엔에프글로벌",
  },
  description:
    "1990년 출발한 종합식품회사 ㈜비엔에프글로벌. HACCP 인증 제조공장에서 HMR·소스·면류·수산가공품을 제조하고, 무역·유통·물류를 아우르는 식품 전문 기업입니다.",
  keywords: ["비엔에프글로벌", "B&F GLOBAL", "식품제조", "OEM", "ODM", "HMR", "HACCP"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
