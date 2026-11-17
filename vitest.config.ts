import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    exclude: ["backend-reference/**", "node_modules/**", "dist/**"],
  },
});
