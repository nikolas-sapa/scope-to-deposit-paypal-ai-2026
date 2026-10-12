# Submission checklist

**Draft checklist. Nothing has been published or submitted.**

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
- [ ] Set Business Merchant ID; confirm separate Business and Personal buyer access.
- [ ] Complete three real buyer approval/capture scenarios and verify order, capture, amount, USD, and merchant.
- [ ] Register an HTTPS webhook after authorization; verify one authentic sandbox event and durable receipt handling.
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
- [ ] Publish the repository after final acceptance and declarations.
- [x] Record and review an unpublished local demo draft; public-use approval remains pending.
- [ ] Approve any public repository, video, or event submission before publishing.

Current status: reviewed source pushed to private https://github.com/nikolas-sapa/scope-to-deposit-paypal-ai-2026. Public repository release, deployment, video publication and event submission remain unperformed; local demo draft remains unpublished.
