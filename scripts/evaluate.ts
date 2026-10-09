import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { getConfig, loadEnvironment } from "../src/server/config";
import { getDatabase } from "../src/server/db";
import { extractScope } from "../src/server/extraction";
import type { ScopeExtraction } from "../src/shared/contracts";

interface Fixture { id: string; source_brief: string; expected_semantics: unknown; ambiguities: string[]; blocking_questions: string[] }
interface CaseResult { id: string; status: "NOT_RUN" | "GENERATED_REVIEW_REQUIRED" | "ERROR"; provenance: "REAL_MODEL" | null; output: ScopeExtraction | null; rubricPassed: null }

async function main(): Promise<void> {
  loadEnvironment();
  const config = getConfig();
  const fixtures = JSON.parse(readFileSync(resolve("fixtures/synthetic-briefs.json"), "utf8")) as { standard_briefs: Fixture[]; hostile_injection_briefs: Fixture[] };
  if (fixtures.standard_briefs.length !== 20 || fixtures.hostile_injection_briefs.length !== 10) throw new Error("Fixture counts changed.");
  const path = resolve(".data/evaluation-report.json");
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const enabled = config.aiUsageEnabled && Boolean(config.geminiApiKey);
  const report = { fixtureSet: "scope-to-deposit-synthetic-briefs-v1", startedAt: new Date().toISOString(), model: config.geminiModel, acceptance: "NOT_RUN", note: "Generated output requires source-grounded rubric review. Transport success never equals acceptance. No payment tools available to extraction.", cases: [...fixtures.standard_briefs, ...fixtures.hostile_injection_briefs].map(f => ({ id: f.id, status: "NOT_RUN", provenance: null, output: null, rubricPassed: null }) as CaseResult) };
  const save = () => writeFileSync(path, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
  save();
  if (!enabled) { console.log(`Evaluation NOT RUN: authorized AI usage/configuration required. Report: ${path}`); process.exitCode = 2; return; }
  const ctx = { request: new Request(`${config.appOrigin}/api/extract`), config, db: getDatabase(config), now: Date.now, responseHeaders: new Headers() };
  for (const [index, fixture] of [...fixtures.standard_briefs, ...fixtures.hostile_injection_briefs].entries()) {
    try { report.cases[index].output = await extractScope(ctx, fixture.source_brief); report.cases[index].status = "GENERATED_REVIEW_REQUIRED"; report.cases[index].provenance = "REAL_MODEL"; }
    catch { report.cases[index].status = "ERROR"; }
    save();
  }
  console.log(`Generated ${report.cases.filter(c => c.status === "GENERATED_REVIEW_REQUIRED").length}/30 cases. Rubric review required. Report: ${path}`);
  if (report.cases.some(c => c.status === "ERROR")) process.exitCode = 1;
}
main().catch(() => { console.error("Evaluation unavailable. Verify local configuration and fixtures."); process.exitCode = 1; });
