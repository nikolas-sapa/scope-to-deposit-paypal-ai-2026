# Scope to Deposit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox syntax. User authorizes independent parallel packets after shared contracts settle; workers never commit/push. Main owns integration, manifests, lockfiles, decisions and commits.

**Goal:** A working local, sandbox-only scope-to-deposit product with genuine AI extraction and PayPal evidence when access permits, with unrun external checks disclosed.

**Architecture:** Human delegated architecture/product decisions on 2026-10-08. Coordinator selected A: one Next.js App Router Node server, local SQLite via installed runtime's `node:sqlite` DatabaseSync, USD integer cents. Browser uses authenticated owner APIs and scoped buyer APIs; only server controls payment dispatch/evidence.

**Tech Stack:** Next 16.3.8, React/React DOM 19.3.0, TypeScript 5.9.3, Zod 4.6.5, Vitest 4.1.11, Playwright 1.63.0, Geist 1.7.2, Tailwind 4.3.3, official shadcn primitives. Versions verified against existing npm date cutoff, which remains unchanged. Tested Node 25.8.1; pin supported engine >=24,<26 and record runtime limitations. Native SQLite runtime probe already succeeded; module API stability does not imply production readiness.

## Global Constraints

- Sandbox only. Fixed PayPal REST origin `https://api-m.sandbox.paypal.com`; no configurable live origin, payouts or refunds.
- AI drafts only. No tools, approval, owner authority, monetary inputs, payment dispatch or credentials in model context.
- USD-only, integer cents, integer quantity. Maximum 100 items, quantity 1–1000, unitCents 0–100000000, totalCents <=100000000000. Check safe-integer multiplication/sums; `0 < depositCents <= totalCents`.
- Explicit approval and no unresolved blocking questions before create/capture. Immutable snapshot and operation payload/bindings.
- At most one guarded attempt and one paid deposit per engagement across all revisions. Unknown/pending/expired-idempotency outcomes never authorize replacement.
- Verify completed capture's exact order, configured merchant, gross deposit amount and USD before paid transition. Redirects are not evidence.
- Authenticate webhook, durably commit verified receipt before 2xx, deduplicate event/capture IDs, resume unprocessed receipts. No transaction spans await.
- Context7 consulted before framework code. Evidence in session work/docs. Source style: Geist Sans, accent #006bff, no orange or emoji, accessible labels/focus/errors, reduced motion.
- No spend, accounts/access changes, publishing/deploying/submitting/messages. AI generation disabled until explicitly authorized usage; missing PayPal config fails payment operations closed without disabling auth/drafts.
- User task data/logs/review briefs in session work/; final artifacts in this repository. No duplicate worktrees needed for dedicated clean feature branch. Never revert others' edits.
- Test specification T01–T20 precedes this plan. Fixtures/mocks cannot satisfy real provider/model claims. Main verifies reports and runnable artifacts.

## Shared records and interfaces (locked before dispatch)

Main creates `src/shared/contracts.ts`, `src/server/schema.sql`, and `CONTRACTS.md` with exact DTOs, SQL constraints, routes and signatures. Workers import them, never change them independently.

Records: owners, opaque sessions (anonymous CSRF bootstrap allowed), engagements, optimistic-version drafts, approved immutable quotes, guarded attempts, unique create/capture operations, hashed buyer capabilities, one paid deposit per engagement, durable verified webhook receipts. SQL foreign keys and prepared statements mandatory; immutable triggers enforce approved commercial fields and dispatched operation keys/payloads.

Server context `HttpContext`: request, DatabaseSync connection, Config, UTC clock function, response Headers. Request-derived `OwnerPrincipal {ownerId}` and `BuyerPrincipal {capabilityId,attemptId,quoteId}`. Service functions recheck resource ownership/bindings. Browser never supplies a principal.

`Config` contains APP_ORIGIN, DATABASE_PATH, sandbox client ID/secret and merchant ID, webhook ID, GEMINI_API_KEY/GEMINI_MODEL, AI_USAGE_ENABLED. Proposed configuration names become operative only in config module and `.env.example`; existing repo `.env` absent, actual inherited Gemini name verified. No session signing secret needed for hashed opaque database sessions. Selected Gemini model `gemini-3.8-flash` was returned by authenticated metadata lookup; production generation remains disabled; later three-call diagnostic allowance/results recorded in AI_SMOKE_RESULTS.md.

## Task 1: Shared contract and scaffold, main

**Files:** create package.json/package-lock.json, tsconfig.json, next.config.ts, postcss.config.mjs, vitest.config.ts, playwright.config.ts, .gitignore, .env.example, src/shared/contracts.ts, src/server/schema.sql, CONTRACTS.md. Main alone owns all these.

**Produces:** DTOs and route contracts from CONTRACTS.md; schema; installed pinned dependencies; scripts dev/build/start/typecheck/test/test:e2e/setup:owner/check:access/evaluate.

- [x] Write exact contracts/schema and fixture-safe limits, before implementation packets.
- [x] Install verified pinned versions with npm; retain date cutoff and record installed versions.
- [x] Compile a contract probe and native SQLite schema initialization; require 0 type errors and 1 successful real SQLite transaction (not mocked).
- [x] Commit scaffold/contract; record base for next packet. No remote exists, so push unavailable.

## Task 2: Authenticated quote foundation, Sol backend

**Files:** create src/server/config.ts, errors.ts, db.ts, auth.ts, engagements.ts; scripts/setup-owner.ts; tests/server/auth.test.ts, engagements.test.ts, db.test.ts. Owned exclusively by Task 2. Main schema/DTO files prohibited.

**Interfaces:** signatures in CONTRACTS.md. Auth bootstrap/login/logout/owner+buyer guards; openDatabase/transaction/getDatabase; create/list/get/save/approve engagement. Payment issue/create/capture not implemented here.

- [x] Add failing real-SQLite tests, including:
```ts
expect(() => transaction(db, () => Promise.resolve())).toThrow();
// assert 10 cross-owner operations denied, 10 auth bypass requests denied,
// 10 frozen-revision mutations denied, 10 unapproved checkout prerequisites denied.
```
- [x] Run `npm test -- tests/server`, observe missing-module/function failures.
- [x] Implement config with fixed sandbox, exact Host/Origin, opaque sessions (15-minute anonymous, 8-hour owner), random 32-byte token/CSRF/capability hashes, scrypt N=131072 r=8 p=1 maxmem256MiB, login throttling and bounded concurrent hashing. Setup provisions private local access file with restrictive permissions, never prints passwords.
- [x] Implement bounded drafts, optimistic version edits and server-authoritative approval. SQL triggers/guards must reject immutable rewrites even through direct DB tests. Explicit incomplete drafts can save; approval cannot.
- [x] Run task tests/typecheck; require numerical local checks, real database persistence/reopen check, 0 leaks in representative errors. Save evidence/report in work/PLAN/task-2-report.md.
- [x] Main verifies files/tests, commits, generates diff package; independent Sol task review checks spec compliance and quality. Fix material findings before payment packet.

## Task 3: Sandbox payment/evidence services, Sol backend

**Files:** create src/server/paypal.ts, payments.ts, webhooks.ts; tests/server/paypal.test.ts, payments.test.ts, webhooks.test.ts. Depends Task 2 reviewed. Exact services in CONTRACTS.md.

- [x] Write controlled failure/race tests for T02/T03/T09–T13/T17–T20, using real SQLite and explicitly mocked provider transport. Count provider capture IDs independently of local state transitions.
- [x] Run focused tests and observe missing service failures.
- [x] Implement OAuth caching, create/get/capture Orders v2, registered-webhook postback verification. Use fixed sandbox URL, 15-second timeout, generic redacted errors, stable keys persisted before calls. ProviderOperation propagates persisted retryUntil; gateway checks margin after OAuth before POST. Confirmed Orders retention 6h; no retry after deadline. Approval link must use PayPal sandbox HTTPS host.
- [x] Implement owner issueCheckout with reserved guarded attempt and 24-hour hashed fragment capability; return capabilityId for the existing owner revocation route; buyer creates/captures only after valid capability+CSRF/Origin. Operation lease serialized in SQLite, no transaction across await. Any dispatched uncertain operation retains engagement guard; do not suppress evidence when capability expires after dispatch.
- [x] Implement private verified-evidence application, durable webhook receipt processing, same-ID/different-body rejection, restart reconciliation. Webhook never independently dispatches capture. Unknown create remains guarded if key retention expires.
- [x] Run targeted tests/typecheck; real sandbox configuration absent is a tested explicit unavailable response, never a mock payment UI. Save report/evidence. Authenticated provider API and T05/T15 remain NOT RUN until access exists.
- [x] Main verifies, obtains independent Sol code/security approval and commits. Review findings fixed before backend handoff; full product acceptance remains pending.

## Task 4: Real AI extraction boundary, Sol backend

**Files:** create src/server/extraction.ts; tests/server/extraction.test.ts. Depends approved shared contract; independent preparation and scoped checks run alongside Task 2; main manages scheduling. Integrated application checks follow all server modules.

- [x] Write tests that real Zod rejects unexpected monetary/privilege fields and hostile outputs; 10 hostile cases cause 0 privileged actions/secret context disclosures.
- [x] Implement Gemini REST adapter using selected model/key, structured response schema, strict validation and bounded input/output. `extractScope(ctx,brief): Promise<ScopeExtraction>` returns facts/questions only; no model tools or payment credentials. Model output never saves/approves commercial terms automatically.
- [x] Gate actual generation with AI_USAGE_ENABLED, false by default until explicit approved usage. Missing permission/config returns CONFIG_REQUIRED. No fixture is displayed as real extraction.
- [x] Run tests with labeled transport fixtures and real validator; genuine 20-case T01 requires approved usage. Save report; main verifies/reviews/commits.

## Task 5: Owner and buyer UI, Luna frontend

**Files:** create src/ui/**, including api.ts, OwnerWorkspace.tsx, BuyerCheckout.tsx, primitives/**, cn.ts, styles.css. Depends shared route/DTO contract and Task 2 reviewed; independent from payment implementation. Main owns src/app page/layout adapters and fonts import.

- [x] Port five retained official shadcn source primitives with MIT provenance from session work/ui-sources. Use only installed approved dependencies. No icons/animation SDK needed.
- [x] Implement login/logout and owner workflow: synthetic brief prefill, genuine extraction only when enabled, editable scope/questions, bounded line items/deposit, explicit approve, copy buyer link, payment state/reconcile. Handle field errors and pending/unknown clearly. Client never controls authoritative capture amount or paid flag.
- [x] Implement `/pay` buyer view: read token from fragment into tab sessionStorage; send only X-Checkout-Token header to same-origin API. PayPal return `/pay?approved=1` contains no capability. Require server evidence for paid status; cancellation observation remains separate. No capability in logs/referrers.
- [x] Surface missing integration configuration honestly. No mock checkout or fake success mode in product.
- [x] Typecheck and production build pass; actual production browser run covers owner workflow, blocker/approval, missing-provider fail-closed path, auth/Origin/logout, buyer token handling, responsive layout, bundle scan, and console errors. 23/23 checks pass. Genuine paid screenshots remain unavailable. Independent UI reviews completed and findings fixed/re-reviewed.

## Task 6: Route integration and local judge tooling, main

**Files:** create src/app/layout.tsx, page.tsx, pay/page.tsx, api/[...path]/route.ts; src/server/http.ts; scripts/check-access.ts, evaluate.ts; tests/e2e/workflow.spec.ts. Depend services and UI. Worker drafts README under main-assigned packet after commands exist.

- [x] Implement exact route matrix, strict Zod request inputs, authenticated owner/buyer guards, safe errors and security response headers. All mutations require Origin+CSRF except PayPal-authenticated webhook. Node runtime, no caching of sensitive responses.
- [x] Wire local startup/setup/health/readiness and controlled scheduler/recovery with no duplicate hot-reload instances. Record server-only secrets boundary; no raw logging.
- [x] Run build/typecheck/tests and actual browser auth/manual quote/approval/missing-provider checks with 0 unexpected console errors. Owner auth/Origin boundaries, logout, responsive layout, buyer capability handling, and browser bundle scan pass; cross-owner denial remains covered by backend service tests. Screenshots show actual local states; no paid state asserted.
- [x] Check-access obtains OAuth only if secure PayPal config exists; no create/capture during access preflight. Evaluation runner saves REAL_MODEL per-case results only with usage enabled, otherwise NOT RUN.
- [x] Complete test ledger: local checks marked local; T01 genuine model, T05 three sandbox payments, T15 authentic event and other provider claims remain NOT RUN because prerequisites are absent. No passing suite repeated without new changes/concerns.

## Task 7: Independent review and deliverables

**Files:** reviewer read-only whole branch; assigned Luna drafts README.md, SUBMISSION.md, DEMO_SCRIPT.md, SUBMISSION_CHECKLIST.md, TOOL_INVENTORY.md; main owns LICENSE decision, architecture diagram and actual RESULTS.md.

- [x] Commission independent gpt-6.1-sol/high typescript-reviewer and security-reviewer after runnable integrated code. Review packages in work/PLAN. Reviewers never edit.
- [x] Fix reported TypeScript races and logout capability retention; both reviewers rechecked their scoped findings and reported them resolved.
- [x] Draft only verified behavior; future video shots explicitly pending. 150-second script fits 3-minute maximum. Public source must never contain credentials. Main chooses MIT for entrant code, retains third-party notices.
- [x] Fresh detached worktree setup passes in 33.59s on Node 25.8.1 / npm 11.11.0: npm ci, owner setup, typecheck, production build, start and health 200. PayPal/AI configs remain false; no external provisioning counted.
- [x] Main final acceptance and local commits complete. No remote/publish/deploy/registration/submission/spend without authorization; deployment if later approved must reach Ready and live URL verification.

## Plan self-review

Local closeout: 139/139 tests, TypeScript, production build and 15/15 actual production HTTP checks pass. UI: 23/23 production-browser checks pass; independent TypeScript/security review findings fixed and re-reviewed. README, submission draft, demo script and 158.88s recorded draft, checklist, and third-party notices complete. Fresh checkout passes in 33.59s. RESULTS.md records local provenance and genuine checks still NOT RUN. Source pushed to private GitHub origin on 2026-10-10; remote commit verified. PAYPAL_SETUP.md supplies human account steps. AI_SMOKE_RESULTS.md records three failed HTTP400 requests, zero outputs and exhausted diagnostic allowance. Public release and submission remain pending genuine acceptance and entrant facts.

T01/T14 -> Task 4/6; T02–T07/T09–T13/T15/T17–T20 -> Tasks 2/3/6; T08/T16 -> Tasks 5/6/7. Every shared record/route/signature is defined before dispatch in CONTRACTS.md. Dependencies and owned paths do not overlap; main alone owns route adapters/manifests/schema. Missing external access blocks only genuine checks, never causes fixture passes to be reported as integration. User delegated architecture decisions, so no further architecture choice prompt.
