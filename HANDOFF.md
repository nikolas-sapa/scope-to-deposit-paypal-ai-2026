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

Workers preserve other edits, do not spawn, commit, push, publish, deploy, change access or spend. Main owns integration and commits. Private origin: https://github.com/nikolas-sapa/scope-to-deposit-paypal-ai-2026. Current branch pushed; remote commit verified.

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

PayPal account setup remains user-owned. A user-provided Business Merchant ID is stored in ignored local configuration. No PayPal account changes or transactions were made here. Real captures and authentic webhook checks still need separate sandbox buyer access and approved HTTPS webhook access/registration. Historical Gemini metadata/countTokens access succeeded, but three bounded generation requests failed HTTP400 INVALID_ARGUMENT; see AI_SMOKE_RESULTS.md. Later user direction replaced Gemini with Vyce. The Vyce catalog check was metadata-only; on 2026-10-12 one direct synthetic-brief generation succeeded and one app-adapter attempt failed. No key/account changes. Exact provider charges are unknown. AI remains disabled. Human entrant/ownership declarations and eventual repository/video publication/submission remain pending.

One bounded Vyce smoke was run; pricing and actual charges remain unverified. Historical Gemini smoke: three HTTP400 responses, zero validated outputs, cumulative reservation ceiling US$0.051642, actual charge unknown. Current Vyce model catalog returned HTTP200 with 7 models. One direct smoke returned valid JSON (370 tokens); one app-adapter attempt failed, with exact charge unknown. AI stays disabled; Vyce rate is not public and no aggregate spend ledger exists. Full T01/T14 evaluation remains NOT RUN. PayPal buyer access, webhook ID, verified payment evidence, and entrant declarations remain pending; Merchant ID is present in local configuration only. Public release, deployment and submission remain unperformed.
