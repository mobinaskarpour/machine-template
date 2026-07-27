import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
