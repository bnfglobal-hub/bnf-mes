/**
 * 주문 마감·출고일 계산 순수 함수.
 * 모든 날짜는 KST 기준 로컬 Date 를 사용한다(서버 TZ 주의: 호출부에서 KST now 를 넘긴다).
 */

export interface DeliveryRule {
  weekdayCutoff: string; // "15:00"
  allowSaturdayOrder: boolean;
  allowHolidayOrder: boolean;
  minLeadDays: number; // 최소 리드타임(일)
  allowSameDay: boolean;
  shipDays: number[]; // 출고 가능 요일 0=일..6=토 (본사 공통)
}

export interface StoreShipConfig {
  deliveryDays: number[]; // 가맹점 배송요일
  orderCutoff: string; // 가맹점 마감 "HH:mm"
}

function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function isHoliday(d: Date, holidays: string[]): boolean {
  return holidays.includes(ymd(d));
}

/** 주문 가능 여부 (요일/휴일 기준) */
export function canOrderToday(now: Date, rule: DeliveryRule, holidays: string[]): { ok: boolean; reason?: string } {
  const dow = now.getDay();
  if (dow === 0) return { ok: false, reason: "일요일은 주문할 수 없습니다." };
  if (dow === 6 && !rule.allowSaturdayOrder) return { ok: false, reason: "토요일은 주문할 수 없습니다." };
  if (isHoliday(now, holidays) && !rule.allowHolidayOrder) return { ok: false, reason: "휴무일에는 주문할 수 없습니다." };
  return { ok: true };
}

/** 마감시간 전인지 */
export function isBeforeCutoff(now: Date, cutoff: string): boolean {
  const { h, m } = parseTime(cutoff);
  return now.getHours() * 60 + now.getMinutes() < h * 60 + m;
}

/**
 * 예상 출고일 계산.
 * - 마감 전 주문: 주문일 + minLeadDays 부터 탐색 (allowSameDay면 당일부터)
 * - 마감 후 주문: 하루 밀림
 * - 출고 가능 요일(본사 shipDays ∩ 가맹점 deliveryDays)이며 휴일이 아닌 가장 빠른 날
 */
export function calcShipDate(
  now: Date,
  rule: DeliveryRule,
  store: StoreShipConfig,
  holidays: string[] = [],
  blockedDates: string[] = []
): Date {
  const cutoff = store.orderCutoff || rule.weekdayCutoff;
  const afterCutoff = !isBeforeCutoff(now, cutoff);
  let leadDays = rule.allowSameDay && !afterCutoff ? 0 : Math.max(1, rule.minLeadDays);
  if (afterCutoff) leadDays = Math.max(leadDays, rule.minLeadDays + 1);

  const allowedDays = rule.shipDays.filter((d) => store.deliveryDays.includes(d));
  const candidateDays = allowedDays.length > 0 ? allowedDays : rule.shipDays;

  let candidate = addDays(startOfDay(now), leadDays);
  for (let i = 0; i < 60; i++) {
    const dow = candidate.getDay();
    if (
      candidateDays.includes(dow) &&
      !isHoliday(candidate, holidays) &&
      !blockedDates.includes(ymd(candidate))
    ) {
      return candidate;
    }
    candidate = addDays(candidate, 1);
  }
  return candidate; // 60일 내 불가 시 마지막 후보(비정상 설정 방어)
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function formatShipDateLabel(d: Date): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
}

export { ymd as formatYmd };
