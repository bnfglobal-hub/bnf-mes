import { describe, it, expect } from "vitest";
import { canTransition } from "@/lib/domain/order-service";
import { backoffMinutes, maskSensitive } from "@/lib/ecount/service";
import { matchesSearch, toChosung } from "@/lib/utils";
import { usernameToEmail, isValidUsername } from "@/lib/login-domain";

describe("주문 상태 전이", () => {
  it("정상 흐름 허용", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "PICKING")).toBe(true);
    expect(canTransition("PICKING", "PICKED")).toBe(true);
    expect(canTransition("PICKED", "SHIPPED")).toBe(true);
    expect(canTransition("PICKED", "PARTIALLY_SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
    expect(canTransition("PENDING", "CANCEL_REQUESTED")).toBe(true);
    expect(canTransition("CANCEL_REQUESTED", "CANCELLED")).toBe(true);
  });
  it("비정상 전이 차단", () => {
    expect(canTransition("DELIVERED", "PENDING")).toBe(false);
    expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false);
    expect(canTransition("PENDING", "SHIPPED")).toBe(false);
    expect(canTransition("REJECTED", "CONFIRMED")).toBe(false);
  });
});

describe("ERP 재시도 백오프", () => {
  it("지수 백오프 (1→2→4→8→16, 최대 16분)", () => {
    expect(backoffMinutes(1)).toBe(1);
    expect(backoffMinutes(2)).toBe(2);
    expect(backoffMinutes(3)).toBe(4);
    expect(backoffMinutes(5)).toBe(16);
    expect(backoffMinutes(10)).toBe(16);
  });
});

describe("민감정보 마스킹", () => {
  it("키/비밀번호/세션 마스킹", () => {
    const masked = maskSensitive({
      COM_CODE: "123", API_CERT_KEY: "secret", nested: { session_id: "abc", qty: 3 }, list: [{ password: "x" }],
    }) as Record<string, unknown>;
    expect(masked.API_CERT_KEY).toBe("***");
    expect((masked.nested as Record<string, unknown>).session_id).toBe("***");
    expect((masked.nested as Record<string, unknown>).qty).toBe(3);
    expect(((masked.list as Record<string, unknown>[])[0]).password).toBe("***");
  });
});

describe("초성 검색", () => {
  it("초성 추출", () => {
    expect(toChosung("냉면육수")).toBe("ㄴㅁㅇㅅ");
  });
  it("초성/부분 문자열 매칭", () => {
    expect(matchesSearch("냉면육수 500g", "ㄴㅁ")).toBe(true);
    expect(matchesSearch("냉면육수 500g", "육수")).toBe(true);
    expect(matchesSearch("냉면육수 500g", "갈비")).toBe(false);
  });
});

describe("로그인 아이디", () => {
  it("아이디 → 내부 이메일 변환", () => {
    expect(usernameToEmail("Gangnam")).toBe("gangnam@bnf-order.local");
  });
  it("아이디 형식 검증", () => {
    expect(isValidUsername("abc")).toBe(true);
    expect(isValidUsername("한글아이디")).toBe(false);
    expect(isValidUsername("ab")).toBe(false);
  });
});
