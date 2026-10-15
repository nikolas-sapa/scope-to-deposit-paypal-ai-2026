# Submission checklist

**Entry checklist. Source repository is public; event entry and public video remain unfinished.**

## Local package

- [x] Historical full run2026-10-12: source build and TypeScript checks pass.
- [x] Historical full run:141 local service tests pass;23/23 production-browser checks cover owner workflow, capability handling, logout, missing-provider behavior and responsive layout.
- [x] README documents the actual setup and sandbox-only boundaries.
- [x] MIT notice retained for the five adapted shadcn/ui primitives.
- [x] Root `LICENSE` is MIT.
- [x] Browser bundle scan found no private config names or generated owner password.
- [x] Timed clean-checkout run completed on Node.js 25.8.1/npm 11.11.0: install, owner setup, TypeScript, production build, and health 200 in 33.59 seconds.
- [x] Silent captioned local demo draft recorded and reviewed: 164.80 seconds, 1440×1000. It shows one genuine verified $1 Sandbox deposit and labels AI acceptance as not run.
- [x] After the Vyce provider switch, production health returned HTTP 200 with sandbox-only mode enabled and AI usage disabled. This historical health check made no provider calls.

## External acceptance evidence

- [x] Verify OAuth-only PayPal Sandbox access with current app credentials; no order/capture created.
- [x] Store the user-provided Business Merchant ID in ignored local `.env.local`; canonical evidence now validates its binding on all3 genuine captures.
- [x] Confirm separate Business and Personal buyer access through genuine buyer approval of the first order.
- [x] Complete first genuine USD1 Sandbox order/approval/capture from an approved USD10 manual quote. Canonical order/capture/merchant/USD amount match, one REAL_SANDBOX paid deposit.
- [x] Complete all3 real buyer approval/capture scenarios: USD1/2/3 deposits against approved USD10/20/30 quotes. Canonical order/capture/amount/USD/merchant match; exactly one completed capture per order. T05 PASS2026-10-15.
- [x] Register one Sandbox HTTPS webhook, confirm exact event subscription through readback, save private ID and activate runtime.
- [x] Verify3 authentic PAYMENT.CAPTURE.COMPLETED events, one per capture, persisted and processed as paid. T15 PASS. Temporary receiver stopped after testing; existing registration retained. Future genuine captures require a new listener and URL-only renewal/readback. Broader fault/restart criteria remain incomplete.
- [x] Historical Gemini diagnostic: three requests failed HTTP400, zero validated outputs; reserved ceiling US$0.051642, actual charge unknown.
- [ ] Resolve Vyce quota/reset and pricing unit before any further call. One bounded `deepseek-v4-flash` application-adapter request returned HTTP 429 with no usage metadata; debit is unknown. Do not retry. Production `AI_USAGE_ENABLED` remains false.
- [ ] Run the 20-brief source-grounded extraction rubric and review every output.
- [ ] Capture review-required, genuine paid, and canceled/failed unpaid screenshots from their actual states. Never synthesize paid evidence.
- [ ] Keep provider/model evidence labeled `REAL_SANDBOX`, `REAL_MODEL`, or `LOCAL_FIXTURE` as appropriate.

## Human decisions and release

- [x] Rechecked official event rules and deadline on 2026-10-12: [Devpost rules](https://paypalaihackathon.devpost.com/rules). Requirements: public licensed source, functional demo, public YouTube video under 3 minutes, and free judge access through December 15.
- [ ] Confirm entrant type, conflict/support exclusions, ownership, and required participant declarations.
- [ ] Review the final project description against verified behavior before submission.
- [x] Create/select a private source remote and verify the pushed commit.
- [x] Publish the reviewed MIT-licensed source repository under explicit user authorization; anonymous public access verified.
- [x] Record and review an unpublished local demo draft; publication authorized, final evidence review and YouTube access still needed.
- [x] User explicitly authorized finishing and submission, including required publication. No eligibility/conflict/ownership facts inferred from that authorization.

Current status (2026-10-15): reviewed source is public at https://github.com/nikolas-sapa/scope-to-deposit-paypal-ai-2026. All3 genuine Sandbox captures and3 authentic webhooks are verified; no buyer approval remains pending for these scenarios. USD2/3 normal returns visibly showed server-verified paid states, with no PNG exports. Independent security review confirmed original reservations/undispatched operations preserved. Updated local demo draft is164.80seconds and unpublished. Vyce returned HTTP429; debit, billing unit and quota/reset are unknown. AI remains disabled. Broader fault criteria, entrant declarations, authenticated YouTube/Devpost access, final video review and submission remain incomplete.
