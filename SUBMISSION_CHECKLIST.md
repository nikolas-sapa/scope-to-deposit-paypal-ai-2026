# Submission checklist

**Entry checklist. Source repository is public; event entry and public video remain unfinished.**

## Local package

- [x] Source builds and TypeScript checks pass.
- [x] 141 local service tests pass; 23/23 production-browser checks cover owner workflow, capability handling, logout, missing-provider behavior, and responsive layout.
- [x] README documents the actual setup and sandbox-only boundaries.
- [x] MIT notice retained for the five adapted shadcn/ui primitives.
- [x] Root `LICENSE` is MIT.
- [x] Browser bundle scan found no private config names or generated owner password.
- [x] Timed clean-checkout run completed on Node.js 25.8.1/npm 11.11.0: install, owner setup, TypeScript, production build, and health 200 in 33.59 seconds.
- [x] Silent captioned local demo draft recorded and reviewed: 164.80 seconds, 1440×1000. It shows one genuine verified $1 Sandbox deposit and labels AI acceptance as not run.
- [x] After the Vyce provider switch, production health returned HTTP 200 with sandbox-only mode enabled and AI usage disabled. This historical health check made no provider calls.

## External acceptance evidence

- [x] Verify OAuth-only PayPal Sandbox access with current app credentials; no order/capture created.
- [x] Store the user-provided Business Merchant ID in ignored local `.env.local`; payment use remains unverified.
- [x] Confirm separate Business and Personal buyer access through genuine buyer approval of the first order.
- [x] Complete first genuine USD1 Sandbox order/approval/capture from an approved USD10 manual quote. Canonical order/capture/merchant/USD amount match, one REAL_SANDBOX paid deposit.
- [ ] Complete two more of three real buyer approval/capture scenarios and verify order, capture, amount, USD, and merchant. Two prepared checkout links await human buyer approval; no capture helper replay.
- [x] Register one Sandbox HTTPS webhook, confirm exact event subscription through readback, save private ID and activate runtime.
- [x] Renew temporary listener URL on existing webhook and verify one authentic PAYMENT.CAPTURE.COMPLETED event persisted and processed as paid. Receiver liveness remains temporary; fault/restart acceptance still pending.
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
- [x] Record and review an unpublished local demo draft; publication authorized, final buyer evidence and YouTube access still needed.
- [x] User explicitly authorized finishing and submission, including required publication. No eligibility/conflict/ownership facts inferred from that authorization.

Current status (2026-10-14): reviewed source is public at https://github.com/nikolas-sapa/scope-to-deposit-paypal-ai-2026. One of three intended genuine Sandbox captures and one authentic webhook are verified; two buyer approvals remain pending. Updated local demo draft is 164.80 seconds and unpublished. Vyce returned HTTP 429; debit, billing unit, and quota/reset are unknown. AI remains disabled. Entrant declarations, authenticated YouTube/Devpost access, and final submission remain incomplete.
