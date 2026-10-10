# Scope to Deposit implementation handoff

Architecture authorized through delegated decisions: Next.js App Router, native SQLite, USD integer cents, sandbox only. Contracts in CONTRACTS.md; numerical acceptance checks in SPEC.md; implementation and ownership in PLAN.md.

Current phase: local UI and delivery drafts complete. TypeScript passes; 139 local tests, production build, backend HTTP 15/15, and production-browser checks 23/23 pass. Independent UI TypeScript/security reviews completed and findings fixed. Fresh checkout at `3376cf6` completed install, owner setup, typecheck, production build, and health 200 in 33.59s. UI and documentation commits are local on `hackathon/paypal-preflight`. PayPal/AI-backed acceptance and genuine paid screenshots remain unrun until access and authorization exist. No Git remote configured.

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

Workers preserve other edits, do not spawn, commit, push, publish, deploy, change access or spend. Main owns integration and commits. No Git remote configured; local commits cannot be pushed yet.

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

PayPal sandbox app credentials, Business merchant and separate Personal buyer access remain unavailable. Real captures and authentic webhook checks require these plus approved HTTPS webhook access/registration. Existing Gemini model-list access succeeded, but real generation remains disabled pending authorized usage/budget. Human entrant/ownership declarations and eventual repository/video publication/submission remain pending.

No account changes, paid generation, live money, deployment, publication, submission or messages authorized. No remote exists to push to. External access, AI usage authorization, and publication decisions remain human inputs.
