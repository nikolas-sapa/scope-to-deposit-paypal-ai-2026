# Verification results

Backend verified 2026-10-09; local UI, browser, and silent captioned demo draft verified 2026-10-10. No genuine PayPal transaction, authentic webhook or AI generation performed.

## Checks executed

| Check | Result | Provenance |
| --- | --- | --- |
| Full server suite | 139/139 tests, 10/10 suites pass, 6.80s | Real local SQLite/scrypt/CLI/validation; explicit provider/model transport fixtures |
| Canonical TypeScript | 0 diagnostics; also passed inside production build | LOCAL_RUNTIME |
| Production build | Exit0; dynamic /api/[...path] route generated | LOCAL_RUNTIME |
| Production HTTP roundtrip | 15/15 checks pass, 0 failures | LOCAL_RUNTIME, actual npm start and HTTP requests |
| Production-browser UI workflow | 23/23 checks pass; 0 unexpected console errors; one expected invalid-capability 401 | LOCAL_RUNTIME, Playwright Chromium against `npm start` |
| Fresh-checkout setup | 33.59s total: checkout 0.36s, `npm ci` 7.48s, private owner setup 1.37s, typecheck 5.84s, production build 17.20s, production start/health 1.15s; health 200 | Fresh detached Git worktree at commit `3376cf6`, Node 25.8.1 / npm 11.11.0; no provider/AI config |
| UI screenshots | Owner approved quote desktop/mobile, login, buyer capability unavailable | Actual local production UI; no paid state asserted |
| Local demo video draft | 14/14 state assertions pass; H.264 MP4, 1440×1000, 25 fps, 158.88s, silent | Actual production UI in Playwright Chromium; isolated local SQLite, blank PayPal/Gemini credentials, AI disabled; frames reviewed, no credentials/tokens/devtools shown |
| Logout capability cleanup | Storage cleared on logout and unauthenticated bootstrap; re-review passed | Synthetic browser-only capability; no provider token |
| Responsive layout | 390px mobile viewport, no horizontal overflow | Actual local production UI |
| Browser asset scan | No private config field names or provisioned owner password in JS bundles | Actual local production build |
| Owner authentication/ownership | 10 bypass, 10 CSRF/Origin, 10 cross-owner service checks denied; real setup credentials private | LOCAL_RUNTIME |
| Frozen quote and amount validation | 10 immutable rewrites/deletions denied; exact integer totals and review blockers checked | LOCAL_RUNTIME |
| Payment/evidence scenarios | Stable keys, races, lifetime capture counts, lost responses, SQLite reopen, expiry, mismatches, receipt durability and fair batches checked | LOCAL_FIXTURE, not real PayPal |
| AI boundary | 50/50 schema/gate/hostile-output/timeout checks pass | LOCAL_FIXTURE with real Zod, not real model quality |
| Access CLI | Expected exit2, NOT_CONFIGURED | No PayPal OAuth/order/capture dispatched |
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

Independent backend code/security approval and final configuration re-review are recorded in session work/PLAN. Independent UI code/security reviews also completed, with findings resolved as described above. Genuine provider/model acceptance remains unverified.

## Acceptance ledger

This table distinguishes local evidence from the complete SPEC.md criterion. No fixture establishes genuine provider/model acceptance.

| ID | Current evidence and remaining acceptance |
| --- | --- |
| T01 | NOT RUN, genuine 20-case model extraction and rubric review require authorized usage |
| T02 | Local exact-deposit and override checks pass; real checkout/capture matching NOT RUN |
| T03 | Local replay convergence pass; genuine callback/event convergence NOT RUN |
| T04 | 10 local pre-capture cancellation observations remain unpaid; genuine provider cancellation evidence NOT RUN |
| T05 | NOT RUN, three real sandbox buyer approvals/captures |
| T06 | Backend ownership/auth checks pass; production browser verified owner login/manual quote flow/logout. Cross-owner denial is covered by server tests, not a two-owner browser session |
| T07 | Private files ignored; UI commit and final staged docs scan both report 0 leaks. Browser bundle excludes private config names and generated owner password |
| T08 | Local fresh-checkout install/setup/typecheck/build/start verified in 33.59s (<15min); external account provisioning excluded from future setup time if required |
| T09 | Local frozen quote, review blocker and unapproved dispatch checks pass |
| T10 | Local concurrent/replayed capture counts pass; genuine provider-backed race evidence NOT RUN |
| T11 | Local file-backed SQLite reopen/lost-response recovery pass; genuine sandbox fault/restart evidence NOT RUN |
| T12 | Local uncertain/expired-retention guard and zero replacement checks pass; provider-backed acceptance NOT RUN |
| T13 | 10 local malformed/failed-verification cases rejected; authentic provider verification NOT RUN |
| T14 | 10 local hostile brief/output boundary cases cause0 privileged actions/disclosures; real model run NOT RUN |
| T15 | NOT RUN, genuine registered-webhook event |
| T16 | Local owner approval, login, mobile, buyer-unavailable screenshots, and captioned demo draft captured; genuine paid/canceled provider-state screenshots NOT RUN |
| T17 | Local overlapping revisions keep one guarded attempt; genuine provider evidence NOT RUN |
| T18 | Local cancellation/capability races pass; genuine provider evidence NOT RUN |
| T19 | Local failure before persistence and SQLite reopen after persistence pass; genuine delivery/restart NOT RUN |
| T20 | Local mismatched/reused capture rejection pass; authentic mismatched-provider evidence NOT RUN |

## Operational limits

Single local Node process, loopback by default. Runtime Node25.8.1, native SQLite API not a production-stability claim. Rate limits and recovery cursor are process-local and reset after restart; persisted attempts/keys/receipts remain durable. Recovery batches rotate fairly, at most20 attempts per cycle; webhook receipts use fair bounded retries. Vite emits a future config-loader warning, current tests pass.

No Git remote, deployment, publication or submission. Real PayPal credentials/merchant/buyer access and authorized AI usage remain missing. No complete product or hackathon acceptance claim.

## Local demo draft

Unpublished captioned walkthrough: `../release/scope-to-deposit-local-demo-draft.mp4`. The video shows the real local production UI with a synthetic brief, manual scope and quote, blocking question, explicit approval, missing PayPal configuration, unavailable buyer route, and logout. The local owner session was established through an API request before the page recording; no password, session token, cookie, devtools, or paid state is shown. Genuine PayPal captures, webhook proof, and AI evaluation are labeled NOT RUN. Full decode and sampled-frame review passed. This draft is not external judge-access or provider acceptance evidence.
