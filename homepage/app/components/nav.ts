export type NavChild = { href: string; label: string };
export type NavItem = { href: string; label: string; children?: NavChild[]; external?: boolean };

/* 원본 사이트(bnfglobal.co.kr)의 메뉴 구조를 그대로 옮김 */
export const NAV: NavItem[] = [
  { href: "/", label: "HOME" },
  {
    href: "/company/greeting",
    label: "회사소개",
    children: [
      { href: "/company/greeting", label: "인사말" },
      { href: "/company/history", label: "회사연혁" },
      { href: "/company/business", label: "사업분야" },
      { href: "/company/manufacturing", label: "식품제조" },
      { href: "/company/certification", label: "인증현황" },
      { href: "/company/location", label: "오시는 길" },
    ],
  },
  {
    href: "/products/import",
    label: "제품소개",
    children: [
      { href: "/products/import", label: "수입 제품" },
      { href: "/products/oil", label: "식용 유지" },
      { href: "/products/frozen", label: "냉동 수산 / 축산물" },
      { href: "/products/hmr-export", label: "HMR(수출용)" },
      { href: "/products/hmr", label: "HMR(내수용)" },
      { href: "/products/sauce", label: "소스 / 육수" },
      { href: "/products/noodle", label: "면류" },
      { href: "/products/seafood", label: "수산물가공품 / 절임식품" },
      { href: "/products/etc", label: "기타 가공품" },
    ],
  },
  {
    href: "/support/oem",
    label: "고객센터",
    children: [
      { href: "/support/oem", label: "OEM 견적" },
      { href: "/support/contact", label: "문의하기" },
    ],
  },
  { href: "https://smartstore.naver.com/bnfglobal", label: "쇼핑몰", external: true },
];

export const COMPANY_INFO = {
  name: "(주)비엔에프글로벌",
  ceo: "이용재",
  privacyOfficer: "이정길",
  tel: "1688-3362",
  bizNo: "120-86-43118",
  mailOrderNo: "제2013-경기하남-0052호",
  hq: { label: "본사(F1)", addr: "경기도 하남시 산곡로 8", tel: "031 794 5071", fax: "031 794 5009" },
  factory: { label: "공장(F2)", addr: "경기도 이천시 백사면 이여로 260-15", tel: "031 633 1518", fax: "031 634 6454" },
};
