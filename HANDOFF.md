# Scope to Deposit implementation handoff

Architecture authorized through delegated decisions: Next.js App Router, native SQLite, USD integer cents, sandbox only. Contracts in CONTRACTS.md; numerical acceptance checks in SPEC.md; implementation and ownership in PLAN.md.

Current phase: local UI, delivery drafts and 158.88s unpublished demo draft complete. Current source uses Vyce `deepseek-v4-flash`; metadata returned HTTP200, 7 models, selected model available. A direct synthetic-brief smoke returned valid JSON (370 tokens); one app-adapter attempt failed. Exact Vyce rate/debit unknown; AI stays disabled. PayPal Sandbox OAuth is verified. A user-provided Business Merchant ID is now stored in ignored local configuration; buyer access and genuine transaction acceptance remain unverified. See PAYPAL_SETUP.md.

## Model ownership

| Work | Assigned model | Files/responsibility |
| --- | --- | --- |
| Authenticated owner and quote services | gpt-6.1-sol | src/server/config.ts, db.ts, auth.ts, errors.ts, engagements.ts; setup-owner script and tests |
| Payment/evidence services | gpt-6.1-sol | src/server/paypal.ts, payments.ts, webhooks.ts and tests |
| AI extraction boundary | gpt-6.1-sol | src/server/extraction.ts and tests |
| Integration and decisions | Coordinator | Shared contracts/schema/manifests; HTTP routes, maintenance, local check scripts; commits |
| Independent code/security review | gpt-6.1-sol | Read-only, backend review before handoff; integrated review after UI changes as needed |
| Owner/buyer interface | gpt-6-luna | src/ui/**; page/layout wiring under coordinator-assigned ownership |
| All browser work | gpt-6-luna only | Actual browser workflow and screenshots; no fixture payment claims |
| Delivery drafts | gpt-6-luna | Assigned README/submission/demo/checklist files, grounded in verified results |

Workers preserve other edits, do not spawn, commit, push, publish, deploy, change access or spend. Main owns integration and commits. Public origin: https://github.com/nikolas-sapa/scope-to-deposit-paypal-ai-2026. Current branch pushed; remote commit verified.

## Invariants carried forward

- AI supplies facts/questions only. No model tools, money authority or approval; initial question answers null.
- Server authenticates owner and buyer scope, checks ownership and immutable quote bindings, and validates integer money.
- One guarded attempt and one paid deposit per engagement across all revisions. Uncertain/pending/expired-retention outcomes never authorize replacement.
- Persist operation keys/payloads before dispatch; reconcile original order. Completed capture must match order, merchant, gross deposit and USD.
- Browser return/cancel is observation only. Verified evidence wins races and remains applicable after capability expiry/revocation.
- Authenticate webhook and persist receipt before acknowledgement. Deduplicate event/capture identities and resume pending receipts.
- LOCAL_FIXTURE checks are not genuine PayPal/AI acceptance evidence. RESULTS.md records actual checks and limits.

## Luna prerequisites

Use locked DTOs/routes, five retained official shadcn primitives from session work/ui-sources, Geist Sans, #006bff accent, no orange or emoji. Client cannot invent paid state or submit authoritative order/amount. Capability stays in fragment/tab sessionStorage and X-Checkout-Token header, never PayPal URL.

Handle missing integrations honestly. Owner CheckoutLink includes capabilityId for revocation. Keep buyer approval and pending/uncertain states clear. Open exactly configured APP_ORIGIN, loopback127.0.0.1 by default; strict Host/Origin checks reject aliases. Implement manual scope/quote workflow even while AI generation is disabled. Verify actual running UI; paid-state screenshot requires genuine provider evidence.

## External checks still needing inputs

PayPal account setup remains user-owned. A user-provided Business Merchant ID is stored in ignored local configuration. One Sandbox webhook registration was made and read back; no order/capture or genuine event occurred. Real captures and authentic webhook checks still need separate sandbox buyer access and genuine delivery through the registered temporary HTTPS listener. Historical Gemini metadata/countTokens access succeeded, but three bounded generation requests failed HTTP400 INVALID_ARGUMENT; see AI_SMOKE_RESULTS.md. Later user direction replaced Gemini with Vyce. The Vyce catalog check was metadata-only; on 2026-10-12 one direct synthetic-brief generation succeeded and one app-adapter attempt failed. No key/account changes. Exact provider charges are unknown. AI remains disabled. Human entrant/ownership declarations, authenticated video/submission access and genuine acceptance remain pending; source repository is now public.

One bounded Vyce smoke was run; pricing and actual charges remain unverified. Historical Gemini smoke: three HTTP400 responses, zero validated outputs, cumulative reservation ceiling US$0.051642, actual charge unknown. Current Vyce model catalog returned HTTP200 with 7 models. One direct smoke returned valid JSON (370 tokens); one app-adapter attempt failed, with exact charge unknown. AI stays disabled; Vyce rate is not public and no aggregate spend ledger exists. Full T01/T14 evaluation remains NOT RUN. PayPal buyer access, genuine webhook delivery, verified payment evidence, and entrant declarations remain pending; Merchant ID is present in local configuration only. Source repository is public. Video publication and event submission remain unperformed.

2026-10-13 continuation: public source verified anonymously. One Sandbox webhook registered/read back with1OAuth/1create/2list calls; ID saved privately and app activation health says webhookConfigured=true, AI disabled. Buyer reports ready to approve manually; no buyer password needed. The three original expired reserved attempts and six undispatched operations remain unchanged. A fresh owner-approved synthetic USD10 quote produced exactly one genuine USD1 Sandbox order through the application. Four attempts total, one order, zero captures/paid deposits; official approval link supplied to buyer. Private claim/intent/result in work/sandbox-first-live-20261013 prevent automatic replay. Capture is prohibited until manual approval is confirmed by canonical provider GET and callback receiver is restored. Fresh temporary exposure failed all177 DNS probes (ENOTFOUND), both owned processes stopped, no webhook PATCH occurred. Renew listener and update this existing registration before capture; configured does not mean reachable. Old preparation metadata is historical; active app PID/origin/database are in private work/webhook-proxy-prep/runtime-activation.json. No further publication/submission approval needed; entrant facts, account access, completed provider/model evidence and final form access remain mandatory.

Later continuation supersedes the pending-payment status above: bounded DNS recovery restored temporary receiver and existing webhook URL PATCH/readback succeeded. Buyer approved using a separate Personal Sandbox account. Direct PayPal link skipped browser capability setup, so return page showed checkout unavailable; original fragment capability remains preserved privately. Fresh canonical GET confirmed APPROVED, correct merchant, USD1 and zero captures. One application capture POST then produced canonical REAL_SANDBOX paid evidence. Exactly one paid deposit and one authentic PAYMENT.CAPTURE.COMPLETED receipt persisted/processed as paid, bound to the same capture/order/USD1. All three original reserved attempts and six undispatched operations unchanged. Evidence: private capture-result.json and webhook-evidence.json under work/sandbox-first-live-20261013. Never replay create/capture helpers. Original buyer link was queued via open_in_codex; visual restoration/screenshot unverified because CUA IAB unavailable. Remaining: two genuine transaction scenarios, broader provider fault acceptance, accepted AI app output/rubric with verified spend bounds, entrant declarations, final video and submission access.
