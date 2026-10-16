# Verification results

October 16 AI status: 28 GLM dispatches, 22 schema-accepted outputs and 35,857 reported tokens; two timeouts and two HTTP 402 responses lack usage. T01 remains FAIL (1/20 strict cases), T14 incomplete (2/10). The latest prompt has no accepted real output. Fresh access recheck returned HTTP 402 in 409 ms; cause unresolved. Published source 1a5247f uses a 45-second whole AI fetch/body deadline; PayPal timeouts are unchanged. Local 172/172 tests, TypeScript and production build PASS. Codex IAB works with authenticated Vyce. Judge key remains private, sharing unapproved. The reviewed 177.00-second video is published UNLISTED at https://youtu.be/tdFlgzJ0MXY; both YouTube checks completed with No issues, and Save confirmed publication at 2:57. The watch page confirms UNLISTED and working playback (177.021-second duration, no player error). Devpost accepted the video embed and saved the story, tags, GitHub URL and video through Save & continue, DRAFT 4/5. Additional information persisted on readback. No final project submission or judge-key sharing has occurred.

Latest payment verification, 2026-10-15: 3/3 genuine Sandbox buyer approvals and captures completed for USD1/2/3 deposits against approved USD10/20/30 manual quotes. Canonical order/capture evidence matches persisted REAL_SANDBOX records, merchant, amount and USD currency; each order has exactly one completed capture. Three authentic PAYMENT.CAPTURE.COMPLETED events were verified, persisted and processed as paid, one per capture. Normal buyer returns for USD2/3 visibly showed server-verified payment. The USD1 paid-state screenshot remains private; USD2/3 observations were captured in browser tool output only, with no exported PNG files.

Current source verification: 172/172 tests PASS, TypeScript and production build PASS under Node24.21.0; prompt source 2d066 passed independent TypeScript/security review. Published source is 1a5247f; source 1a5247f extends the whole AI fetch/body deadline to 45 seconds, with PayPal unchanged; latest prompt has no accepted real output. Production AI remains disabled. Historical DeepSeek HTTP 429 and unverified debit/unit remain context; current GLM free rate was explicitly $0/1M tokens in provider UI. See AI_SMOKE_RESULTS.md.

Additional read-only evidence reconstruction passed on2026-10-15 using source7300b64:1OAuth request and26canonical Sandbox GETs,0other provider operations/rejected calls, and exact logical preservation of all10 original database tables. Provenance: **REAL_SANDBOX_EVIDENCE + RECONSTRUCTED_LOCAL_STATE**. These isolated local checks reuse canonical completed-payment evidence; they are not new capture contention, induced lost responses, genuine crash/redelivery, signature-forgery or full T20 acceptance. Their numeric fault thresholds come from internal SPEC.md, not separate organizer requirements. No app source or AI usage changed.

## Checks executed

| Check | Result | Provenance |
| --- | --- | --- |
| Full server suite | Current source run: 172/172 tests PASS, TypeScript and production build PASS under Node24.21.0; prompt independently reviewed | LOCAL_RUNTIME/LOCAL_FIXTURE; real-model semantic results separate |
| Canonical TypeScript | 0 diagnostics; also passed inside production build | LOCAL_RUNTIME |
| Production build | Exit0; dynamic /api/[...path] route generated | LOCAL_RUNTIME |
| Current prepared runtime | Safely resumed 2026-10-14; sandbox-only, AI disabled; payment/receipt/capability rows preserved; no eligible provider maintenance work | LOCAL_RUNTIME_RECHECK; no provider calls |
| Three checkout preparations | 79/79 local checks; USD deposits100/200/300 cents; original three reservations and six undispatched operations remain unchanged | LOCAL_SETUP; synthetic manual drafts |
| Local launcher hardening | 24/24 assertions; redirect refusal, explicit child environment, bounded process-group shutdown including SIGTERM refusal | Scratch launcher only; existing runtime not restarted; fetch wrapper is not comprehensive OS egress control |
| Webhook-only receiver preparation | 211 local HTTP assertions including rolling6/min,30/hour and120/lifetime budget; independent TypeScript/security/advisor review | Temporary HTTPS receiver accepted three authentic capture events; 2026-10-15 public route restriction and existing registration readback passed, with no registration PATCH that day |
| Sandbox payment and webhook | 3/3 USD1/2/3 deposits verified against canonical orders, exactly one completed capture each, merchant, amount and USD; three authentic PAYMENT.CAPTURE.COMPLETED receipts processed as paid | REAL_SANDBOX; three genuine paid deposits and three authentic receipts, verified 2026-10-15 |
| Read-only evidence reconstruction | PASS;1OAuth+26canonical GETs,0other provider operations; baseline/final3 known orders each retain exactly1 completed capture; all10 original tables logically unchanged | REAL_SANDBOX_EVIDENCE + RECONSTRUCTED_LOCAL_STATE; independent security review of27journals/13private case databases;14offline checks and strict scratch TypeScript pass |
| Reconstructed reconciliation and receipts | Three reconstructions converge to1 REAL_SANDBOX paid row each; two copied authenticated receipt raw/hash cases process as paid;10 concurrent completed-order callbacks yield1 isolated paid insert/0capture POSTs;10 sequential stored-receipt processing calls yield1 paid insert; close/reopen receipt yields1 paid insert | Isolated local state with genuine existing evidence; no new provider capture, lost response, crash or redelivery induced |
| Reconstructed rejection boundaries | Eight local binding changes rejected (4amount,3merchant,1preclaimed capture); unknown guard retains1attempt/2operation identities while10replacement and10expired retries denied. Five revoked+5expired capabilities and10malformed required-header cases denied with0provider dispatches;10other targets remain unpaid | RECONSTRUCTED_LOCAL_STATE against unchanged canonical responses; no authentic foreign/mismatched provider event or signature-forgery test |
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
| AI boundary | Current 82/82 extraction checks pass, including exact 45-second whole fetch/body deadline, valid 20-second response, late-response rejection and immediate HTTP 402/401/429 failure without retries | LOCAL_FIXTURE with real Zod, not real model quality |
| Access CLI | `OAUTH_VERIFIED` on 2026-10-12 after guard fix | One OAuth token request only; no order/capture dispatched |
| Bounded application-adapter harness | Real v1: 20/20 ordinary and 2 hostile outputs schema accepted; 23 dispatches stopped on INJ03 transport timeout, immutable STOP retained | REAL_MODEL; semantic T01 FAIL, T14 incomplete; no automatic retry |
| Stock evaluation CLI | Historical disabled-config check: expected exit 2, 30/30 NOT_RUN, zero outputs or model dispatches | LOCAL_FIXTURE; stock CLI was not used for the guarded real-model benchmark |
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
| T01 | FAIL: independent semantic review of real v1 outputs found 1/20 strict passes, 29/46 ambiguities and 31/51 expected blocking questions; 18/20 outputs contained nonempty assumptions while source fixtures had none. Unsupported SYN03 exclusion and SYN06 next-Friday timing identified; 20/20 schema acceptance is not quality acceptance |
| T02 | Local exact-deposit/override checks pass; three genuine USD1/2/3 order/capture/merchant/USD matches verified. Full 10/10 quote criterion remains incomplete |
| T03 | Three authentic events converged on existing captures. Reconstructed completed-order callbacks10concurrent and stored-receipt processing10sequential each yield1 isolated paid insert,0capture POSTs. Full genuine callback/event replay scenario remains NOT RUN |
| T04 | 10 local pre-capture cancellation observations remain unpaid; genuine provider cancellation evidence NOT RUN |
| T05 | PASS, 3/3 genuine Sandbox buyer approvals/captures verified for USD1/2/3 deposits against approved USD10/20/30 quotes; canonical order, capture, merchant, amount and USD match persisted evidence |
| T06 | Backend ownership/auth checks pass; production browser verified owner login/manual quote flow/logout. Cross-owner denial is covered by server tests, not a two-owner browser session |
| T07 | Private files ignored; UI commit and final staged docs scan both report 0 leaks. Browser bundle excludes private config names and generated owner password |
| T08 | Local fresh-checkout install/setup/typecheck/build/start verified in 33.59s (<15min); external account provisioning excluded from future setup time if required |
| T09 | Local frozen quote, review blocker and unapproved dispatch checks pass |
| T10 | Reconstructed local state:10 concurrent callbacks against an already-completed canonical order yield1 paid insert,0capture POSTs;10sequential stored-receipt processing calls yield1 insert. Genuine capture contention/race criterion NOT RUN |
| T11 | Three isolated reconstructions converge to1 paid record each using existing canonical evidence; genuine paid runtime restart previously preserved rows. No genuine lost create/capture response induced; full criterion incomplete |
| T12 | Reconstructed unknown state retains1attempt/2operation identities;10replacement requests+10expired retries denied,0replacement dispatches. Canonical baseline/final captures unchanged; full provider-backed scenario incomplete |
| T13 | Ten malformed required-header cases denied locally with0provider dispatches; historical failed-verification fixtures pass. Genuine signature-forgery scenario NOT RUN |
| T14 | INCOMPLETE: local hostile-boundary fixtures pass; 2/10 real hostile cases reviewed, then INJ03 transport timeout stopped v1. No full real-model hostile acceptance claim |
| T15 | PASS, three authentic PAYMENT.CAPTURE.COMPLETED events verified, persisted and processed as paid against their existing captures; exceeds the at-least-one criterion |
| T16 | Local owner/login/mobile/unavailable screenshots and demo draft captured; genuine paid USD1 screenshot captured and visually reviewed. Canceled provider-state screenshot NOT RUN |
| T17 | Local overlapping revisions keep one guarded attempt; genuine provider evidence NOT RUN |
| T18 | Five revoked+5expired capabilities denied in reconstructed local state with0provider calls. Genuine cancellation/capture races and post-dispatch expiry cases remain NOT RUN |
| T19 | Copied authenticated raw/hash receipts process as paid; isolated close/reopen yields1paid insert. No new genuine crash/redelivery induced; full criterion incomplete |
| T20 | Eight reconstructed local binding mismatches rejected against unchanged canonical responses:4amount,3merchant,1preclaimed capture. Authentic foreign/mismatched provider evidence and full10-case criterion NOT RUN |

## Operational limits

Single local Node process, loopback by default. Current Sandbox runtime Node24.21.0; historical full-suite/setup checks used Node25.8.1. Native SQLite API is not a production-stability claim. Rate limits and recovery cursor are process-local and reset after restart; persisted attempts/keys/receipts remain durable. Recovery batches rotate fairly, at most20 attempts per cycle; webhook receipts use fair bounded retries. The temporary webhook proxy and tunnel were stopped after testing on 2026-10-15; the app remained healthy with AI disabled. The existing webhook registration is retained. Future genuine captures require a new listener, URL-only renewal of that same registration and exact readback. Vite emitted a future config-loader warning in the historical passing run.

Production Vyce usage remains gated off. Across October 16 GLM experiments, 28 dispatches are recorded: 22 schema-accepted outputs, 35,857 reported tokens, two timeouts and two HTTP 402 responses without usage. The earlier minimal diagnostic returned HTTP 402 insufficient_balance in 752 ms; the fresh access recheck returned HTTP 402 in 409 ms. Enabled-key and positive-credit metadata do not establish the cause or billing certainty. Conservative unknown-usage holds remain private. The latest source-grounding prompt has no accepted real output. Published source 1a5247f uses one 45-second AI fetch/body deadline, independently reviewed and locally verified; no claim that it fixes HTTP 402. Dedicated capped key remains private and unshared; sharing is unapproved and free judge access is not provided.

Public GitHub repository: https://github.com/nikolas-sapa/scope-to-deposit-paypal-ai-2026, source 1a5247f published. Registration and entrant declarations complete. Three genuine Sandbox payments and authentic webhooks pass; v1 real-model schema acceptance passed but semantic T01 failed and T14 is incomplete. Latest quality prompt has no accepted real output; HTTP 402 provider cause and free judge AI access remain blockers. The reviewed AI deadline change is committed and pushed in 1a5247f. No complete product, judging-access or submission claim.

Codex IAB currently works with authenticated Vyce; browser reconnection is no longer a blocker. Devpost registration and declarations are complete. The reviewed 177.00-second video is published UNLISTED at https://youtu.be/tdFlgzJ0MXY; both YouTube checks completed with No issues, and Save confirmed publication at 2:57. The watch page confirms UNLISTED and working playback (177.021-second duration, no player error). Devpost accepted the video embed and saved the story, tags, GitHub URL and video through Save & continue, DRAFT 4/5. Additional information persisted on readback. No final project submission or judge-key sharing has occurred.

## Local demo draft

Latest genuine-payment evidence is the three verified captures and receipts above. The first checkout's direct-provider-link return initially lacked its capability; its genuine paid-state screenshot was subsequently captured and visually reviewed on 2026-10-14. The USD2/3 tests on 2026-10-15 opened original fragment buyer links, approved at PayPal and returned normally to visible server-verified paid states. These newer browser observations have no exported PNG files. No new AI inference was sent during payment completion.

Current published UNLISTED evidence video: `../release/scope-to-deposit-evidence-draft-20261016.mp4`, 177.00 seconds, 1440×1000, H.264, 25fps, silent English captions. It combines a 15-second condensed actual SYN08 adapter-result card (clean baseline pass) with 162 seconds of historical manual walkthrough/genuine USD1 paid state. Header truthfully records 3 verified Sandbox captures; footer explicitly states overall AI quality target failed and current provider issue unresolved. Full decode returned 0 errors; intro/manual/paid frames visually reviewed with no identifiers, keys or cookies. The historical 164.80-second draft remains unchanged. Published UNLISTED at https://youtu.be/tdFlgzJ0MXY after both YouTube checks reported No issues; Save confirmed publication at 2:57. Devpost accepted the embed and saved project details, DRAFT 4/5. No final Devpost-submission or full-acceptance claim.

Authorized support email was sent to hello@vyceai.com about the unresolved HTTP 402; response pending. No API secret or account-balance amount was sent. This support contact does not establish restored provider access or change the incomplete AI acceptance/judge-access status.
