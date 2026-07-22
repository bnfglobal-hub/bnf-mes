import { test, expect, type Page } from "@playwright/test";

/**
 * 핵심 시나리오 E2E (시드 데이터 기준):
 * 가맹점 로그인 → 허용 상품 확인 → 장바구니 → 최소금액 차단 → 충족 → 주문
 * → 관리자 확정 → Mock ECOUNT 동기화 → 피킹 → 출고 → 가맹점 상태 확인
 */

async function login(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.fill("#username", username);
  await page.fill("#password", password);
  await page.click("button[type=submit]");
  await page.waitForURL(/\/(app|admin)/);
}

test.describe.serial("발주 → 출고 전체 흐름", () => {
  test("가맹점: 허용 상품만 표시 + 최소금액 검증 + 주문", async ({ page }) => {
    await login(page, "seongsu", "store1234!");

    // 성수점 취급상품 확인 (갈비탕 육수 O, 냉면육수 X)
    await page.goto("/app/products");
    await expect(page.getByText("갈비탕 육수 1kg").first()).toBeVisible();
    await expect(page.getByText("냉면육수 500g")).toHaveCount(0);

    // 담기 (소량 → 최소금액 미달)
    await page.getByRole("listitem").filter({ hasText: "갈비탕 육수" }).getByRole("button", { name: /담기/ }).click();
    await page.goto("/app/cart");
    await expect(page.getByText(/남았습니다/)).toBeVisible();
    await expect(page.getByRole("button", { name: /주문하기/ })).toBeDisabled();

    // 수량 늘려 최소금액(10만원) 충족
    const qtyInput = page.locator('input[type="number"]').first();
    await qtyInput.fill("40"); // 3500×40 = 140,000
    await qtyInput.blur();
    await expect(page.getByRole("button", { name: /주문하기/ })).toBeEnabled({ timeout: 10_000 });

    await page.getByRole("button", { name: /주문하기/ }).click();
    await page.getByRole("button", { name: "주문 확정" }).click();
    await expect(page.getByText("주문이 접수되었습니다")).toBeVisible({ timeout: 15_000 });
    const orderNo = await page.locator("p.text-primary").first().textContent();
    expect(orderNo).toMatch(/^BNF-\d{8}-\d{5}$/);
    test.info().annotations.push({ type: "orderNo", description: orderNo ?? "" });
  });

  test("관리자: 주문 확정 → Mock ECOUNT 성공 → 피킹 → 출고", async ({ page }) => {
    await login(page, "hq", "hq1234!");

    // 주문 확정
    await page.goto("/admin/orders?status=PENDING");
    await page.locator("table a").first().click();
    await page.getByRole("button", { name: /주문 확정/ }).click();
    await expect(page.getByText(/전송 대기|전송 완료|전송 중/).first()).toBeVisible({ timeout: 15_000 });

    // ERP 큐 실행 (Mock 성공)
    await page.goto("/admin/ecount");
    await page.getByRole("button", { name: "전송 큐 지금 실행" }).click();
    await expect(page.getByText(/큐 처리:/)).toBeVisible({ timeout: 20_000 });

    // 피킹
    await page.goto("/admin/orders?status=CONFIRMED");
    await page.locator("table a").first().click();
    await page.getByRole("button", { name: "피킹 시작" }).click();
    await page.getByRole("button", { name: "피킹 완료" }).click();
    await page.getByRole("button", { name: "출고 완료" }).click();
    await expect(page.getByText("출고 완료").first()).toBeVisible({ timeout: 15_000 });
  });

  test("가맹점: 주문 상태 확인", async ({ page }) => {
    await login(page, "seongsu", "store1234!");
    await page.goto("/app/orders");
    await expect(page.getByText(/출고 완료|부분 출고/).first()).toBeVisible();
  });
});
