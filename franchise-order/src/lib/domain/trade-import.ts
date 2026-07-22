/**
 * 이카운트 거래내역(판매현황) 붙여넣기 파싱 — 순수 함수.
 * 이카운트에서 거래처코드/품목코드가 포함된 표를 복사해 붙여넣으면
 * (거래처코드, 품목코드) 쌍을 추출한다. 탭/쉼표 구분 모두 지원.
 */

export interface TradePair {
  customerCode: string;
  itemCode: string;
  line: number;
}

export interface ParseResult {
  pairs: TradePair[];
  errors: { line: number; message: string }[];
}

/** 셀에서 거래처/품목 코드 후보 판별용 정리 */
function clean(cell: string): string {
  return cell.trim().replace(/^"|"$/g, "");
}

const HEADER_HINTS = ["거래처", "품목", "코드", "customer", "item", "code", "일자", "수량", "단가", "금액"];

/**
 * 각 행에서 (거래처코드, 품목코드)를 추출한다.
 * - customerIdx/itemIdx 지정 시 해당 열 사용 (1부터)
 * - 미지정 시: 헤더 행에서 "거래처...코드", "품목...코드" 열을 탐색, 없으면 1·2열 사용
 */
export function parseTradeRows(text: string, customerIdx?: number, itemIdx?: number): ParseResult {
  const lines = text.split(/\r?\n/);
  const pairs: TradePair[] = [];
  const errors: { line: number; message: string }[] = [];

  let cIdx = customerIdx != null ? customerIdx - 1 : -1;
  let iIdx = itemIdx != null ? itemIdx - 1 : -1;

  for (let n = 0; n < lines.length; n++) {
    const raw = lines[n];
    if (!raw.trim()) continue;
    const cells = raw.split(raw.includes("\t") ? "\t" : ",").map(clean);

    // 헤더 행 탐지: 코드 열 자동 매핑
    const isHeader = cells.some((c) => HEADER_HINTS.some((h) => c.toLowerCase().includes(h))) &&
      !cells.some((c) => /^\d{4,}/.test(c) && !HEADER_HINTS.some((h) => c.includes(h)));
    if (isHeader) {
      const ci = cells.findIndex((c) => c.includes("거래처") && c.includes("코드"));
      const ii = cells.findIndex((c) => c.includes("품목") && c.includes("코드"));
      if (ci >= 0) cIdx = ci;
      if (ii >= 0) iIdx = ii;
      continue;
    }

    const customerCode = cells[cIdx >= 0 ? cIdx : 0];
    const itemCode = cells[iIdx >= 0 ? iIdx : 1];
    if (!customerCode || !itemCode) {
      errors.push({ line: n + 1, message: "거래처코드 또는 품목코드가 비어 있습니다." });
      continue;
    }
    pairs.push({ customerCode, itemCode, line: n + 1 });
  }

  // 중복 제거
  const seen = new Set<string>();
  const deduped = pairs.filter((p) => {
    const key = `${p.customerCode}::${p.itemCode}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { pairs: deduped, errors };
}
