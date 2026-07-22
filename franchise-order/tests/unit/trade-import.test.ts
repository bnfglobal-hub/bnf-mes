import { describe, it, expect } from "vitest";
import { parseTradeRows } from "@/lib/domain/trade-import";

describe("이카운트 거래내역 붙여넣기 파싱", () => {
  it("헤더에서 거래처코드/품목코드 열을 자동 인식한다", () => {
    const text = [
      "일자\t거래처코드\t거래처명\t품목코드\t품목명\t수량",
      "2026-07-01\tC-GN001\t강남점\tI-NM500\t냉면육수\t20",
      "2026-07-02\tC-GN001\t강남점\tI-GB1K\t갈비탕육수\t10",
    ].join("\n");
    const r = parseTradeRows(text);
    expect(r.errors).toHaveLength(0);
    expect(r.pairs).toEqual([
      { customerCode: "C-GN001", itemCode: "I-NM500", line: 2 },
      { customerCode: "C-GN001", itemCode: "I-GB1K", line: 3 },
    ]);
  });

  it("헤더가 없으면 1열=거래처, 2열=품목으로 처리한다", () => {
    const r = parseTradeRows("C-HN001\tI-SSG150\nC-HN001\tI-JJ280");
    expect(r.pairs).toHaveLength(2);
    expect(r.pairs[0]).toMatchObject({ customerCode: "C-HN001", itemCode: "I-SSG150" });
  });

  it("쉼표(CSV) 구분도 지원한다", () => {
    const r = parseTradeRows("C-SS001,I-DSD\nC-SS001,I-FISH");
    expect(r.pairs).toHaveLength(2);
  });

  it("중복 (거래처,품목) 쌍은 한 번만 반환한다", () => {
    const r = parseTradeRows("C-A\tI-1\nC-A\tI-1\nC-A\tI-2");
    expect(r.pairs).toHaveLength(2);
  });

  it("빈 셀은 행 번호와 함께 오류로 보고한다", () => {
    const r = parseTradeRows("C-A\t\nC-B\tI-1");
    expect(r.errors).toEqual([{ line: 1, message: "거래처코드 또는 품목코드가 비어 있습니다." }]);
    expect(r.pairs).toHaveLength(1);
  });
});
