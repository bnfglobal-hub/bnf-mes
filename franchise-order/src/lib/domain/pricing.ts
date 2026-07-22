/**
 * 금액 계산 순수 함수 — 서버에서 항상 재계산할 때 사용한다.
 * 모든 금액은 원 단위 정수.
 */

export type TaxType = "TAXABLE" | "EXEMPT";
export type MinAmountBasis = "SUPPLY" | "WITH_VAT";

export interface PricedLine {
  qty: number;
  unitPrice: number; // 공급가(원)
  taxType: TaxType;
}

export interface LineAmounts {
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
}

/** 공급가 기준 VAT 10% (원 미만 절사) */
export function calcLine(line: PricedLine): LineAmounts {
  const supplyAmount = Math.round(line.unitPrice * line.qty);
  const vatAmount = line.taxType === "TAXABLE" ? Math.floor(supplyAmount * 0.1) : 0;
  return { supplyAmount, vatAmount, totalAmount: supplyAmount + vatAmount };
}

export interface OrderTotals {
  supplyAmount: number;
  vatAmount: number;
  deliveryFee: number;
  totalAmount: number;
}

export function calcOrderTotals(
  lines: PricedLine[],
  opts: { deliveryFee: number; freeDeliveryThreshold?: number | null; basis?: MinAmountBasis }
): OrderTotals {
  let supply = 0;
  let vat = 0;
  for (const l of lines) {
    const a = calcLine(l);
    supply += a.supplyAmount;
    vat += a.vatAmount;
  }
  const basisAmount = opts.basis === "WITH_VAT" ? supply + vat : supply;
  let deliveryFee = opts.deliveryFee;
  if (opts.freeDeliveryThreshold != null && basisAmount >= opts.freeDeliveryThreshold) {
    deliveryFee = 0;
  }
  return { supplyAmount: supply, vatAmount: vat, deliveryFee, totalAmount: supply + vat + deliveryFee };
}

/** 가맹점 단가 우선순위: 기간 유효한 store_prices > store_products.custom_price > 할인율 적용 > 기본 공급가 */
export function resolveUnitPrice(args: {
  basePrice: number;
  customPrice?: number | null;
  discountRate?: number | null;
  periodPrice?: number | null; // 오늘 유효한 store_prices.price
}): number {
  if (args.periodPrice != null) return args.periodPrice;
  if (args.customPrice != null) return args.customPrice;
  if (args.discountRate != null && args.discountRate > 0) {
    return Math.round(args.basePrice * (1 - args.discountRate / 100));
  }
  return args.basePrice;
}

export interface MinOrderCheck {
  ok: boolean;
  basisAmount: number;
  shortage: number; // 부족액
}

export function checkMinOrderAmount(
  totals: { supplyAmount: number; vatAmount: number },
  minOrderAmount: number,
  basis: MinAmountBasis
): MinOrderCheck {
  const basisAmount = basis === "WITH_VAT" ? totals.supplyAmount + totals.vatAmount : totals.supplyAmount;
  const shortage = Math.max(0, minOrderAmount - basisAmount);
  return { ok: shortage === 0, basisAmount, shortage };
}

/** 수량 검증: 최소/최대/증감단위 (가맹점 오버라이드 우선) */
export function validateQty(
  qty: number,
  rule: { minQty?: number | null; maxQty?: number | null; step?: number | null }
): { ok: boolean; message?: string } {
  const min = rule.minQty ?? 1;
  const step = rule.step ?? 1;
  if (!Number.isInteger(qty) || qty <= 0) return { ok: false, message: "수량이 올바르지 않습니다." };
  if (qty < min) return { ok: false, message: `최소 주문수량은 ${min}개입니다.` };
  if (rule.maxQty != null && qty > rule.maxQty) return { ok: false, message: `최대 주문수량은 ${rule.maxQty}개입니다.` };
  if ((qty - min) % step !== 0) return { ok: false, message: `${min}개부터 ${step}개 단위로 주문할 수 있습니다.` };
  return { ok: true };
}

/** 판매가능재고 = 현재고 - 미반영 예약수량 - 안전재고 */
export function calcAvailableStock(onHand: number, reserved: number, safety: number): number {
  return onHand - reserved - safety;
}

export type StockDisplayMode = "EXACT" | "LEVEL" | "HIDDEN" | "SOLDOUT_ONLY";

export function displayStock(available: number, mode: StockDisplayMode): string | null {
  switch (mode) {
    case "EXACT":
      return available <= 0 ? "품절" : `재고 ${available.toLocaleString("ko-KR")}`;
    case "LEVEL":
      if (available <= 0) return "품절";
      return available < 10 ? "재고 부족" : "재고 충분";
    case "SOLDOUT_ONLY":
      return available <= 0 ? "품절" : null;
    case "HIDDEN":
      return null;
  }
}
