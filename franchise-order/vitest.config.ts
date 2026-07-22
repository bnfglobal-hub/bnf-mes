import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // 순수 함수 테스트를 위해 server-only 가드를 무력화
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
});
