import { defineConfig } from "@playwright/test";

/**
 * E2E — 실행 전 요구사항:
 *  1) Supabase 프로젝트 + migration + `npm run seed` 완료
 *  2) .env.local 설정 후 `npm run dev` 가능한 상태
 * 실행: npm run test:e2e
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    viewport: { width: 390, height: 844 }, // 모바일 기준
  },
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000/login",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
