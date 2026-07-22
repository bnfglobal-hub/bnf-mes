import { describe, it, expect } from "vitest";
import { calcShipDate, canOrderToday, isBeforeCutoff, formatYmd, type DeliveryRule } from "@/lib/domain/delivery-date";

const RULE: DeliveryRule = {
  weekdayCutoff: "15:00",
  allowSaturdayOrder: true,
  allowHolidayOrder: false,
  minLeadDays: 1,
  allowSameDay: false,
  shipDays: [1, 2, 3, 4, 5],
};
const STORE = { deliveryDays: [1, 2, 3, 4, 5], orderCutoff: "15:00" };

// 2026-07-20 = 월요일
const mon = (h: number, m = 0) => new Date(2026, 6, 20, h, m);

describe("마감시간", () => {
  it("15시 전/후 판단", () => {
    expect(isBeforeCutoff(mon(14, 59), "15:00")).toBe(true);
    expect(isBeforeCutoff(mon(15, 0), "15:00")).toBe(false);
  });
});

describe("출고일 계산", () => {
  it("월요일 15시 이전 주문 → 화요일 출고", () => {
    expect(formatYmd(calcShipDate(mon(14), RULE, STORE))).toBe("2026-07-21");
  });
  it("월요일 15시 이후 주문 → 수요일 출고", () => {
    expect(formatYmd(calcShipDate(mon(16), RULE, STORE))).toBe("2026-07-22");
  });
  it("금요일 15시 이후 주문 → 주말 건너뛰고 월요일 출고", () => {
    const fri = new Date(2026, 6, 24, 16); // 금 16시 → 리드 2일 = 일요일, 출고 불가 → 월요일
    expect(formatYmd(calcShipDate(fri, RULE, STORE))).toBe("2026-07-27");
  });
  it("휴일은 건너뛴다", () => {
    expect(formatYmd(calcShipDate(mon(14), RULE, STORE, ["2026-07-21"]))).toBe("2026-07-22");
  });
  it("가맹점 배송요일이 화·목뿐이면 해당 요일로", () => {
    const store = { deliveryDays: [2, 4], orderCutoff: "15:00" };
    expect(formatYmd(calcShipDate(mon(14), RULE, store))).toBe("2026-07-21"); // 화
    expect(formatYmd(calcShipDate(mon(16), RULE, store))).toBe("2026-07-23"); // 마감후 → 목
  });
  it("임시 출고중단일을 피한다", () => {
    expect(formatYmd(calcShipDate(mon(14), RULE, STORE, [], ["2026-07-21"]))).toBe("2026-07-22");
  });
});

describe("주문 가능 여부", () => {
  it("일요일 불가", () => {
    const sun = new Date(2026, 6, 19, 10);
    expect(canOrderToday(sun, RULE, []).ok).toBe(false);
  });
  it("토요일은 설정에 따름", () => {
    const sat = new Date(2026, 6, 25, 10);
    expect(canOrderToday(sat, RULE, []).ok).toBe(true);
    expect(canOrderToday(sat, { ...RULE, allowSaturdayOrder: false }, []).ok).toBe(false);
  });
  it("휴무일 불가", () => {
    expect(canOrderToday(mon(10), RULE, ["2026-07-20"]).ok).toBe(false);
  });
});
