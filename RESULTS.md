# Backend verification results

Verified 2026-10-09. Backend implemented and runnable through the local production API. Product UI, browser acceptance and submission deliverables remain Luna phase. No genuine PayPal transaction, authentic webhook or AI generation performed.

## Checks executed

| Check | Result | Provenance |
| --- | --- | --- |
| Full server suite | 139/139 tests, 10/10 suites pass, 6.80s | Real local SQLite/scrypt/CLI/validation; explicit provider/model transport fixtures |
| Canonical TypeScript | 0 diagnostics; also passed inside production build | LOCAL_RUNTIME |
| Production build | Exit0; dynamic /api/[...path] route generated | LOCAL_RUNTIME |
| Production HTTP roundtrip | 15/15 checks pass, 0 failures | LOCAL_RUNTIME, actual npm start and HTTP requests |
| Owner authentication/ownership | 10 bypass, 10 CSRF/Origin, 10 cross-owner service checks denied; real setup credentials private | LOCAL_RUNTIME |
| Frozen quote and amount validation | 10 immutable rewrites/deletions denied; exact integer totals and review blockers checked | LOCAL_RUNTIME |
| Payment/evidence scenarios | Stable keys, races, lifetime capture counts, lost responses, SQLite reopen, expiry, mismatches, receipt durability and fair batches checked | LOCAL_FIXTURE, not real PayPal |
| AI boundary | 50/50 schema/gate/hostile-output/timeout checks pass | LOCAL_FIXTURE with real Zod, not real model quality |
| Access CLI | Expected exit2, NOT_CONFIGURED | No PayPal OAuth/order/capture dispatched |
| Evaluation CLI | Expected exit2; 30/30 NOT_RUN, 0 outputs, 0 model provenance records | No generation dispatched |
| Git history secret scan | Exit0, 0 leaks in committed history at scan | Redacted gitleaks report retained privately |
| Staged backend secret scan | Exit0, 0 leaks in candidate commit | Redacted gitleaks pre-commit report retained privately |
| npm audit | 0 vulnerabilities at scaffold/foundation review | Pinned dependency graph unchanged |

Production HTTP checks: health200, two bootstrap cookies, login rotation, owner create201, draft/version persistence, stale-version409, exact10000-cent total/5000-cent USD deposit approval, snapshot read, missing PayPal503, unauthenticated401, hostile Origin403, disabled AI503, logout200, revoked owner access401, zero owner password disclosures in server logs. No browser used.

## Review findings fixed

Independent Sol reviewers identified and closed schema replacement/deletion/fractional-money flaws, custom credential Git exposure, OAuth refresh concurrency, recovery batch starvation, database/timer lifetime, and retry dispatch beyond retained key deadline. Main also corrected injected transport provenance and a real production failure: Next normalized 127.0.0.1 to localhost, rejecting strict origin authentication. Official Next16 skipProxyUrlNormalize preserves the original URL; Host, Origin and CSRF checks remain strict.

Last boundary regressions: three expected failures before fix, then 26/26 focused tests pass. Gateway rechecks the persisted retryUntil after OAuth with a30-second conservative margin; expired create/capture dispatches0 payment POSTs and preserves original guard/key/payload. Explicit injected transport is labeled LOCAL_FIXTURE, never REAL_SANDBOX.

Independent backend code/security approval and final configuration re-review are recorded in session work/PLAN. Full product review follows UI integration.

## Acceptance ledger

This table distinguishes local evidence from the complete SPEC.md criterion. No fixture establishes genuine provider/model acceptance.

| ID | Current evidence and remaining acceptance |
| --- | --- |
| T01 | NOT RUN, genuine 20-case model extraction and rubric review require authorized usage |
| T02 | Local exact-deposit and override checks pass; real checkout/capture matching NOT RUN |
| T03 | Local replay convergence pass; genuine callback/event convergence NOT RUN |
| T04 | 10 local pre-capture cancellation observations remain unpaid; genuine provider cancellation evidence NOT RUN |
| T05 | NOT RUN, three real sandbox buyer approvals/captures |
| T06 | Local ownership/authentication checks pass; complete two-owner browser/API workflow remains integration phase |
| T07 | Private files ignored and committed history scan0; browser bundle/final publication scan pending UI |
| T08 | NOT RUN, timed fresh checkout after UI and final setup instructions |
| T09 | Local frozen quote, review blocker and unapproved dispatch checks pass |
| T10 | Local concurrent/replayed capture counts pass; genuine provider-backed race evidence NOT RUN |
| T11 | Local file-backed SQLite reopen/lost-response recovery pass; genuine sandbox fault/restart evidence NOT RUN |
| T12 | Local uncertain/expired-retention guard and zero replacement checks pass; provider-backed acceptance NOT RUN |
| T13 | 10 local malformed/failed-verification cases rejected; authentic provider verification NOT RUN |
| T14 | 10 local hostile brief/output boundary cases cause0 privileged actions/disclosures; real model run NOT RUN |
| T15 | NOT RUN, genuine registered-webhook event |
| T16 | NOT RUN, UI and three real-state screenshots |
| T17 | Local overlapping revisions keep one guarded attempt; genuine provider evidence NOT RUN |
| T18 | Local cancellation/capability races pass; genuine provider evidence NOT RUN |
| T19 | Local failure before persistence and SQLite reopen after persistence pass; genuine delivery/restart NOT RUN |
| T20 | Local mismatched/reused capture rejection pass; authentic mismatched-provider evidence NOT RUN |

## Operational limits

Single local Node process, loopback by default. Runtime Node25.8.1, native SQLite API not a production-stability claim. Rate limits and recovery cursor are process-local and reset after restart; persisted attempts/keys/receipts remain durable. Recovery batches rotate fairly, at most20 attempts per cycle; webhook receipts use fair bounded retries. Vite emits a future config-loader warning, current tests pass.

No Git remote, deployment, publication or submission. Real PayPal credentials/merchant/buyer access and authorized AI usage remain missing. No complete product or hackathon acceptance claim.
