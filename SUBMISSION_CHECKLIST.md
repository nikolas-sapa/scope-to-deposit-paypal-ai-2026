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
- [x] Silent captioned local demo draft recorded and reviewed: 158.88 seconds, 1440×1000, with synthetic brief and genuine PayPal/AI evidence labeled NOT RUN.
- [x] After the Vyce provider switch, production health returned HTTP 200 with sandbox-only mode enabled and AI usage disabled. Business Merchant ID and webhook ID are absent; this historical health check made no provider calls.

## External acceptance evidence

- [x] Verify OAuth-only PayPal Sandbox access with current app credentials; no order/capture created.
- [x] Store the user-provided Business Merchant ID in ignored local `.env.local`; payment use remains unverified.
- [ ] Confirm separate Business and Personal buyer access.
- [x] Create one genuine USD1 Sandbox order through the application using a fresh, manually approved USD10 quote. Approval URL bound to the persisted order; zero captures. Personal buyer approval remains pending.
- [ ] Complete three real buyer approval/capture scenarios and verify order, capture, amount, USD, and merchant.
- [x] Register one Sandbox HTTPS webhook, confirm exact event subscription through readback, save private ID and activate runtime.
- [ ] Renew the stopped temporary listener URL on the existing webhook, then verify one authentic capture event and durable receipt handling.
- [x] Historical Gemini diagnostic: three requests failed HTTP400, zero validated outputs; reserved ceiling US$0.051642, actual charge unknown.
- [ ] Diagnose the failed application-adapter call and verify exact Vyce rate/debit before more calls. One direct synthetic smoke succeeded; one adapter call failed and its charge is unknown. Production `AI_USAGE_ENABLED` remains false.
- [ ] Run the 20-brief source-grounded extraction rubric and review every output.
- [ ] Capture review-required, genuine paid, and canceled/failed unpaid screenshots from their actual states. Never synthesize paid evidence.
- [ ] Keep provider/model evidence labeled `REAL_SANDBOX`, `REAL_MODEL`, or `LOCAL_FIXTURE` as appropriate.

## Human decisions and release

- [x] Rechecked official event rules and deadline on 2026-10-12: [Devpost rules](https://paypalaihackathon.devpost.com/rules). Requirements: public licensed source, functional demo, public YouTube video under 3 minutes, and free judge access through December 15.
- [ ] Confirm entrant type, conflict/support exclusions, ownership, and required participant declarations.
- [ ] Review the final project description against verified behavior before submission.
- [x] Create/select a private source remote and verify the pushed commit.
- [x] Publish the reviewed MIT-licensed source repository under explicit user authorization; anonymous public access verified.
- [x] Record and review an unpublished local demo draft; publication authorized, final provider evidence and YouTube access still needed.
- [x] User explicitly authorized finishing and submission, including required publication. No eligibility/conflict/ownership facts inferred from that authorization.

Current status: reviewed source is public at https://github.com/nikolas-sapa/scope-to-deposit-paypal-ai-2026, verified2026-10-13. Video publication and event submission remain unperformed. Browser-control/authentication, entrant declarations and external acceptance evidence remain incomplete.
