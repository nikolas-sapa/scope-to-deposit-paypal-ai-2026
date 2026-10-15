# Verification results

Latest payment verification, 2026-10-15: 3/3 genuine Sandbox buyer approvals and captures completed for USD1/2/3 deposits against approved USD10/20/30 manual quotes. Canonical order/capture evidence matches persisted REAL_SANDBOX records, merchant, amount and USD currency; each order has exactly one completed capture. Three authentic PAYMENT.CAPTURE.COMPLETED events were verified, persisted and processed as paid, one per capture. Normal buyer returns for USD2/3 visibly showed server-verified payment. The USD1 paid-state screenshot remains private; USD2/3 observations were captured in browser tool output only, with no exported PNG files.

Latest full local test run remains 2026-10-12: 141/141 tests, TypeScript and production build passed. Current Sandbox runtime uses Node24.21.0 with AI disabled. The bounded Vyce application pilot on 2026-10-14 returned HTTP429 without usage metadata; accepted app output, rubric evaluation and exact account charges remain unverified. No new inference was sent during payment completion. See AI_SMOKE_RESULTS.md.

## Checks executed

| Check | Result | Provenance |
| --- | --- | --- |
| Full server suite | Historical 2026-10-12: 141/141 tests, 10/10 suites pass | Real local SQLite/scrypt/CLI/validation; explicit provider/model transport fixtures; accepted real-model app output remains unverified |
| Canonical TypeScript | 0 diagnostics; also passed inside production build | LOCAL_RUNTIME |
| Production build | Exit0; dynamic /api/[...path] route generated | LOCAL_RUNTIME |
| Current prepared runtime | Safely resumed 2026-10-14; sandbox-only, AI disabled; payment/receipt/capability rows preserved; no eligible provider maintenance work | LOCAL_RUNTIME_RECHECK; no provider calls |
| Three checkout preparations | 79/79 local checks; USD deposits100/200/300 cents; original three reservations and six undispatched operations remain unchanged | LOCAL_SETUP; synthetic manual drafts |
| Local launcher hardening | 24/24 assertions; redirect refusal, explicit child environment, bounded process-group shutdown including SIGTERM refusal | Scratch launcher only; existing runtime not restarted; fetch wrapper is not comprehensive OS egress control |
| Webhook-only receiver preparation | 211 local HTTP assertions including rolling6/min,30/hour and120/lifetime budget; independent TypeScript/security/advisor review | Temporary HTTPS receiver accepted three authentic capture events; 2026-10-15 public route restriction and existing registration readback passed, with no registration PATCH that day |
| Sandbox payment and webhook | 3/3 USD1/2/3 deposits verified against canonical orders, exactly one completed capture each, merchant, amount and USD; three authentic PAYMENT.CAPTURE.COMPLETED receipts processed as paid | REAL_SANDBOX; three genuine paid deposits and three authentic receipts, verified 2026-10-15 |
| Registration safety fixtures | 87 assertions across10 isolated scenarios; inherited-env shadowing, concurrency claim, readback failure and ambiguous create checked | LOCAL_FIXTURE,0 real provider calls |
| Offline Vyce diagnostic | 89 assertions across10 fixture cases; live mode refuses before transport | LOCAL_FIXTURE; actual adapter with synthetic injected fetch, no live error cause established |
| Production HTTP roundtrip | 15/15 checks pass, 0 failures | LOCAL_RUNTIME, actual npm start and HTTP requests |
| Production-browser UI workflow | 23/23 checks pass; 0 unexpected console errors; one expected invalid-capability 401 | LOCAL_RUNTIME, Playwright Chromium against `npm start` |
| Fresh-checkout setup | 33.59s total: checkout 0.36s, `npm ci` 7.48s, private owner setup 1.37s, typecheck 5.84s, production build 17.20s, production start/health 1.15s; health 200 | Fresh detached Git worktree at commit `3376cf6`, Node 25.8.1 / npm 11.11.0; no provider/AI config; historical result |
| UI evidence | Owner approved quote desktop/mobile, login, buyer capability unavailable, and genuine paid USD1 screenshot; USD2/3 normal buyer returns visibly server-verified | Actual local production UI; USD1 screenshot visually reviewed 2026-10-14; USD2/3 browser tool observations 2026-10-15, no exported PNG files |
| Initial local demo video draft | 14/14 state assertions pass; H.264 MP4, 1440×1000, 25 fps, 158.88s, silent | Historical local-only draft; updated 164.80s draft adds genuine USD1 paid evidence, remains unpublished |
| Logout capability cleanup | Storage cleared on logout and unauthenticated bootstrap; re-review passed | Synthetic browser-only capability; no provider token |
| Responsive layout | 390px mobile viewport, no horizontal overflow | Actual local production UI |
| Browser asset scan | No private config field names or provisioned owner password in JS bundles | Actual local production build |
| Owner authentication/ownership | 10 bypass, 10 CSRF/Origin, 10 cross-owner service checks denied; real setup credentials private | LOCAL_RUNTIME |
| Frozen quote and amount validation | 10 immutable rewrites/deletions denied; exact integer totals and review blockers checked | LOCAL_RUNTIME |
| Payment/evidence scenarios | Stable keys, races, lifetime capture counts, lost responses, SQLite reopen, expiry, mismatches, receipt durability and fair batches checked | LOCAL_FIXTURE, not real PayPal |
| AI boundary | Schema/gate/hostile-output/timeout fixture checks pass within 141/141 suite | LOCAL_FIXTURE with real Zod, not real model quality |
| Access CLI | `OAUTH_VERIFIED` on 2026-10-12 after guard fix | One OAuth token request only; no order/capture dispatched |
| Evaluation CLI | Expected exit2; 30/30 NOT_RUN, 0 outputs, 0 model provenance records | No generation dispatched |
| Git history secret scan | Exit0, 0 leaks in committed history at scan | Redacted gitleaks report retained privately |
| Staged backend secret scan | Exit0, 0 leaks in candidate commit | Redacted gitleaks pre-commit report retained privately |
| npm audit | 0 vulnerabilities at scaffold/foundation review | Pinned dependency graph unchanged |

Production HTTP checks: health200, two bootstrap cookies, login rotation, owner create201, draft/version persistence, stale-version409, exact10000-cent total/5000-cent USD deposit approval, snapshot read, missing PayPal503, unauthenticated401, hostile Origin403, disabled AI503, logout200, revoked owner access401, zero owner password disclosures in server logs. These were backend-phase HTTP checks; UI checks used an actual browser.

## UI review findings fixed

Independent TypeScript review found a save/edit race and out-of-order engagement selection; controls now disable during pending writes, and stale selection responses are ignored. Independent security review found buyer capability links remained in tab storage after owner logout; logout and unauthenticated bootstrap now clear that storage. Both reviewers rechecked their findings and found them resolved.

## Review findings fixed

Independent Sol reviewers identified and closed schema replacement/deletion/fractional-money flaws, custom credential Git exposure, OAuth refresh concurrency, recovery batch starvation, database/timer lifetime, and retry dispatch beyond retained key deadline. Main also corrected injected transport provenance and a real production failure: Next normalized 127.0.0.1 to localhost, rejecting strict origin authentication. Official Next16 skipProxyUrlNormalize preserves the original URL; Host, Origin and CSRF checks remain strict.

Last boundary regressions: three expected failures before fix, then 26/26 focused tests pass. Gateway rechecks the persisted retryUntil after OAuth with a30-second conservative margin; expired create/capture dispatches0 payment POSTs and preserves original guard/key/payload. Explicit injected transport is labeled LOCAL_FIXTURE, never REAL_SANDBOX.

Independent backend code/security approval and final configuration re-review are recorded in session work/PLAN. Independent UI code/security reviews also completed, with findings resolved as described above. Genuine Sandbox checkout and authentic webhook criteria now pass; broader provider fault criteria and real-model acceptance remain incomplete.

## Acceptance ledger

This table distinguishes local evidence from the complete SPEC.md criterion. No fixture establishes genuine provider/model acceptance.

| ID | Current evidence and remaining acceptance |
| --- | --- |
| T01 | NOT RUN, accepted Vyce app output and genuine20-case rubric evaluation remain unperformed; direct smoke is not app acceptance |
| T02 | Local exact-deposit/override checks pass; three genuine USD1/2/3 order/capture/merchant/USD matches verified. Full 10/10 quote criterion remains incomplete |
| T03 | Local replay convergence pass; three authentic events converged on existing captures. Required ten-repeat genuine callback/event scenario NOT RUN |
| T04 | 10 local pre-capture cancellation observations remain unpaid; genuine provider cancellation evidence NOT RUN |
| T05 | PASS, 3/3 genuine Sandbox buyer approvals/captures verified for USD1/2/3 deposits against approved USD10/20/30 quotes; canonical order, capture, merchant, amount and USD match persisted evidence |
| T06 | Backend ownership/auth checks pass; production browser verified owner login/manual quote flow/logout. Cross-owner denial is covered by server tests, not a two-owner browser session |
| T07 | Private files ignored; UI commit and final staged docs scan both report 0 leaks. Browser bundle excludes private config names and generated owner password |
| T08 | Local fresh-checkout install/setup/typecheck/build/start verified in 33.59s (<15min); external account provisioning excluded from future setup time if required |
| T09 | Local frozen quote, review blocker and unapproved dispatch checks pass |
| T10 | Local concurrent/replayed capture counts pass; genuine provider-backed race evidence NOT RUN |
| T11 | Local file-backed reopen/lost-response recovery pass. Genuine paid runtime restart preserved exact payment/receipt/capability rows; broader fault/lost-response criterion incomplete |
| T12 | Local uncertain/expired-retention guard and zero replacement checks pass; provider-backed acceptance NOT RUN |
| T13 | 10 local malformed/failed-verification cases rejected; provider-backed forged-input scenarios NOT RUN |
| T14 | 10 local hostile brief/output boundary cases cause0 privileged actions/disclosures; real model run NOT RUN |
| T15 | PASS, three authentic PAYMENT.CAPTURE.COMPLETED events verified, persisted and processed as paid against their existing captures; exceeds the at-least-one criterion |
| T16 | Local owner/login/mobile/unavailable screenshots and demo draft captured; genuine paid USD1 screenshot captured and visually reviewed. Canceled provider-state screenshot NOT RUN |
| T17 | Local overlapping revisions keep one guarded attempt; genuine provider evidence NOT RUN |
| T18 | Local cancellation/capability races pass; genuine provider evidence NOT RUN |
| T19 | Local failure before persistence and SQLite reopen after persistence pass; genuine delivery/restart NOT RUN |
| T20 | Local mismatched/reused capture rejection pass; authentic mismatched-provider evidence NOT RUN |

## Operational limits

Single local Node process, loopback by default. Current Sandbox runtime Node24.21.0; historical full-suite/setup checks used Node25.8.1. Native SQLite API is not a production-stability claim. Rate limits and recovery cursor are process-local and reset after restart; persisted attempts/keys/receipts remain durable. Recovery batches rotate fairly, at most20 attempts per cycle; webhook receipts use fair bounded retries. The temporary webhook proxy and tunnel were stopped after testing on 2026-10-15; the app remained healthy with AI disabled. The existing webhook registration is retained. Future genuine captures require a new listener, URL-only renewal of that same registration and exact readback. Vite emitted a future config-loader warning in the historical passing run.

Production Vyce usage remains gated off. No aggregate dollar cap or extraction-specific request limit exists if `AI_USAGE_ENABLED` is changed to `true`; the fixed model and 1,536-token output cap do not bound cumulative spend. Extraction sends the submitted brief to Vyce. One direct synthetic smoke returned valid JSON; no application output has been accepted. User-supplied dashboard rate values lacked a verified unit. One bounded application pilot on 2026-10-14 returned HTTP429 `rate_limit_exceeded` with no usage metadata; actual debit is unknown and no retry was made. Account quota and cumulative spend remain unverified; no model-quality result is claimed.

Public GitHub repository: https://github.com/nikolas-sapa/scope-to-deposit-paypal-ai-2026. Source publication and anonymous access were verified 2026-10-13 under explicit user authorization. Public video and event submission remain incomplete. Three genuine Sandbox deposits and three authentic completion webhooks are verified; independent security review confirmed the original three reservations and six ready, undispatched operations remained exactly preserved. AI remains disabled after HTTP429, with debit, rate unit and quota/reset unverified. Full rubric evaluation is NOT RUN. No complete product or hackathon acceptance claim.

## Local demo draft

Latest genuine-payment evidence is the three verified captures and receipts above. The first checkout's direct-provider-link return initially lacked its capability; its genuine paid-state screenshot was subsequently captured and visually reviewed on 2026-10-14. The USD2/3 tests on 2026-10-15 opened original fragment buyer links, approved at PayPal and returned normally to visible server-verified paid states. These newer browser observations have no exported PNG files. No new AI inference was sent during payment completion.

Unpublished captioned walkthrough: `../release/scope-to-deposit-demo-draft-20261014.mp4`. The updated 164.80-second draft shows the real local production UI and one genuine verified USD1 Sandbox deposit; AI acceptance remains labeled NOT RUN. It predates the two completed buyer flows on 2026-10-15 and needs final evidence review before publication. The earlier 158.88-second draft lacked paid-state evidence. Neither draft establishes external judge usability or full acceptance.
