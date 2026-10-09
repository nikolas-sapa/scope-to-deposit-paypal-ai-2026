import { defineConfig } from "vitest/config";

export default defineConfig({ test: { environment: "node", include: ["tests/server/**/*.test.ts"], testTimeout: 20000, hookTimeout: 20000, maxWorkers: 1 } });
