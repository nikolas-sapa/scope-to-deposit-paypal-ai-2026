import type { HttpContext } from "./context";
import { recoverUnresolved } from "./payments";
import { processReceipts } from "./webhooks";

const globalState = globalThis as typeof globalThis & { scopeMaintenance?: WeakMap<HttpContext["db"], { running: boolean; timer: NodeJS.Timeout }> };
const tasks = globalState.scopeMaintenance ??= new WeakMap();

export function startMaintenance(ctx: HttpContext): void {
  if (tasks.has(ctx.db)) return;
  const state = { running: false, timer: undefined as unknown as NodeJS.Timeout };
  const tick = async () => {
    if (!ctx.db.isOpen) { clearInterval(state.timer); tasks.delete(ctx.db); return; }
    if (state.running) return;
    state.running = true;
    try { await processReceipts(ctx, 20); await recoverUnresolved(ctx); }
    catch { console.warn("Sandbox reconciliation deferred."); }
    finally { state.running = false; }
  };
  state.timer = setInterval(() => { void tick(); }, 60000);
  state.timer.unref();
  tasks.set(ctx.db, state);
  void tick();
}
