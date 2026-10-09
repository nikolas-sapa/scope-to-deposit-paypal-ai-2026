import { afterEach, describe, expect, it, vi } from "vitest";
import { openDatabase } from "../../src/server/db";
import { getConfig } from "../../src/server/config";
import { startMaintenance } from "../../src/server/maintenance";
import type { HttpContext } from "../../src/server/context";

afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });
describe("maintenance timer lifecycle", () => {
  it("starts1 timer per shared connection and removes it after connection closes", async () => {
    vi.useFakeTimers();
    const db = openDatabase(":memory:");
    const ctx: HttpContext = { db, config: getConfig({ NODE_ENV: "test" }), request: new Request("http://127.0.0.1:3000/api/health"), now: Date.now, responseHeaders: new Headers() };
    startMaintenance(ctx);
    startMaintenance({ ...ctx });
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount()).toBe(1);
    db.close();
    await vi.advanceTimersByTimeAsync(60000);
    expect(vi.getTimerCount()).toBe(0);
  });
});
