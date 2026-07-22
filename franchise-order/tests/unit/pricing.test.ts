import { describe, it, expect } from "vitest";
import {
  calcLine, calcOrderTotals, checkMinOrderAmount, resolveUnitPrice, validateQty,
  calcAvailableStock, displayStock,
} from "@/lib/domain/pricing";

describe("VAT 계산", () => {
  it("과세 상품은 공급가의 10% (원 미만 절사)", () => {
    expect(calcLine({ qty: 3, unitPrice: 1815, taxType: "TAXABLE" })).toEqual({
      supplyAmount: 5445, vatAmount: 544, totalAmount: 5989,
    });
  });
  it("면세 상품은 VAT 0", () => {
    expect(calcLine({ qty: 10, unitPrice: 1800, taxType: "EXEMPT" }).vatAmount).toBe(0);
  });
});

describe("주문 합계·배송비", () => {
  const lines = [
    { qty: 10, unitPrice: 10000, taxType: "TAXABLE" as const }, // 100,000 + 10,000
    { qty: 5, unitPrice: 2000, taxType: "EXEMPT" as const },    // 10,000
  ];
  it("배송비 부과", () => {
    const t = calcOrderTotals(lines, { deliveryFee: 3000 });
    expect(t).toEqual({ supplyAmount: 110000, vatAmount: 10000, deliveryFee: 3000, totalAmount: 123000 });
  });
  it("무료배송 기준 충족 시 배송비 0 (공급가 기준)", () => {
    const t = calcOrderTotals(lines, { deliveryFee: 3000, freeDeliveryThreshold: 110000, basis: "SUPPLY" });
    expect(t.deliveryFee).toBe(0);
  });
  it("VAT 포함 기준으로 무료배송 판단", () => {
    const t = calcOrderTotals(lines, { deliveryFee: 3000, freeDeliveryThreshold: 115000, basis: "WITH_VAT" });
    expect(t.deliveryFee).toBe(0); // 120,000 >= 115,000
  });
});

describe("최소 주문금액", () => {
  it("부족액을 계산한다", () => {
    const r = checkMinOrderAmount({ supplyAmount: 257500, vatAmount: 0 }, 300000, "SUPPLY");
    expect(r.ok).toBe(false);
    expect(r.shortage).toBe(42500);
  });
  it("VAT 포함 기준", () => {
    const r = checkMinOrderAmount({ supplyAmount: 280000, vatAmount: 28000, }, 300000, "WITH_VAT");
    expect(r.ok).toBe(true);
  });
});

describe("가맹점 단가 우선순위", () => {
  it("기간단가 > 전용단가 > 할인율 > 기본가", () => {
    expect(resolveUnitPrice({ basePrice: 1000, customPrice: 900, discountRate: 5, periodPrice: 850 })).toBe(850);
    expect(resolveUnitPrice({ basePrice: 1000, customPrice: 900, discountRate: 5 })).toBe(900);
    expect(resolveUnitPrice({ basePrice: 1000, discountRate: 5 })).toBe(950);
    expect(resolveUnitPrice({ basePrice: 1000 })).toBe(1000);
  });
});

describe("주문 수량 검증", () => {
  it("최소·최대·증감단위", () => {
    expect(validateQty(2, { minQty: 3 }).ok).toBe(false);
    expect(validateQty(11, { minQty: 1, maxQty: 10 }).ok).toBe(false);
    expect(validateQty(4, { minQty: 2, step: 2 }).ok).toBe(true);
    expect(validateQty(5, { minQty: 2, step: 2 }).ok).toBe(false);
    expect(validateQty(0, {}).ok).toBe(false);
    expect(validateQty(1.5, {}).ok).toBe(false);
  });
});

describe("판매가능재고", () => {
  it("현재고 - 예약 - 안전재고", () => {
    expect(calcAvailableStock(100, 30, 10)).toBe(60);
  });
  it("표시 정책", () => {
    expect(displayStock(0, "EXACT")).toBe("품절");
    expect(displayStock(5, "LEVEL")).toBe("재고 부족");
    expect(displayStock(50, "LEVEL")).toBe("재고 충분");
    expect(displayStock(50, "SOLDOUT_ONLY")).toBeNull();
    expect(displayStock(50, "HIDDEN")).toBeNull();
  });
});
