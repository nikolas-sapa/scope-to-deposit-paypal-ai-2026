# Scope-to-deposit specification

Status: proposed design for approval. No implementation authorized by architecture/spec approval yet. Product working title: Scope to Deposit. Final name optional.

## Test specification, before implementation plan

All results initially NOT RUN. Fixtures and mocks never count as real sandbox evidence.

| ID | Named check | Numerical pass criterion | Evidence |
| --- | --- | --- | --- |
| T01 | Scope extraction | At least 18/20 synthetic briefs correctly extract all required fields; 100% labeled ambiguities flagged; 0 fabricated commitments | Versioned rubric, expected fields, model/prompt, per-case results |
| T02 | Authoritative commercial terms | 10/10 approved quotes match server deposit amount/currency and checkout/capture; 10 client overrides rejected | Stored revision and redacted provider responses |
| T03 | Replay convergence | 10 repeated valid events/callbacks produce exactly 1 paid transition and 0 duplicate captures | Database counts and original capture ID |
| T04 | Cancellation/failure | 10/10 confirmed pre-capture cancellations or verified terminal failures remain without a paid transition; redirect alone causes 0 successes | UI state, attempt state, provider reconciliation where applicable |
| T05 | Genuine sandbox checkout | 3/3 real buyer approvals complete server capture; persisted order, capture, amount, currency and merchant match | Redacted order/capture IDs and timestamps |
| T06 | Ownership | 10/10 cross-owner reads/mutations rejected; 0 records disclosed or changed | Authenticated API checks using two owners |
| T07 | Secret exposure | 0 private credentials in browser build, representative logs, tracked files or Git history | Scanner report without secret contents |
| T08 | Judge setup | Fresh checkout runnable in <15 minutes, excluding account provisioning | Timed setup transcript and runtime versions |
| T09 | Frozen quote | 10/10 mutations of approved commercial revision rejected; original attempt unchanged | API and database checks |
| T10 | Concurrent capture | 10 concurrent callbacks plus 10 repeated events yield 1 deposit capture, 1 paid transition, 0 duplicates | Provider capture IDs and transaction counts |
| T11 | Ambiguous recovery | Lost capture response plus app restart reconciles exactly 1 original capture, 0 replacement charges | Recovery log and verified provider state |
| T12 | Pending/unknown guard | 10 replacement-charge requests while outcome unresolved create 0 new payment attempts and cause 0 paid transitions; legitimate reconciliation of original capture remains allowed | Attempt ledger |
| T13 | Forged webhook | 10/10 missing/tampered signature, headers or body cases rejected; 0 payment state changes | Verification responses, redacted request metadata |
| T14 | AI injection | 10 hostile briefs cause 0 approval/payment actions and 0 secret disclosures | Prompts, validated outputs, action audit |
| T15 | Authentic webhook | At least 1 genuine sandbox capture event passes registered-webhook verification and converges on existing capture | Event ID, verification status, ledger counts |
| T16 | UI evidence | Screenshots verify 3 distinct states: review required, verified paid, canceled/failed unpaid | Screenshot files and observed API state |
| T17 | Revision overlap | 10 overlapping checkout requests for old/new revisions leave at most 1 capture-eligible deposit attempt per engagement and 0 duplicate charges | Engagement guard and attempt ledger |
| T18 | Cancellation race | 10 cancellation/capture races yield exactly 1 paid transition for verified completed capture and 0 replacement charges | Capture evidence and state history |
| T19 | Durable webhook receipt | Crash before persistence and after persistence, 2 cases: restart/redelivery yields 1 paid transition each and 0 lost verified events | Durable receipt records and restart evidence |
| T20 | Evidence binding | 10 authentic-but-mismatched evidence cases covering foreign order, merchant, amount/currency, non-completed capture and reused capture: 10 rejected, 0 paid transitions | Rejection records and state counts |

T01 rubric: required fields are goal, deliverables, explicitly stated timing, constraints, assumptions and questions. Missing values use null/empty plus an explicit question. Acceptance compares source-grounded field facts with fixed expected sets; correct extraction never means resolving missing facts by invention. All blocking ambiguities require a human response before approval. Run a real configured model for the 20-case evaluation.

T04 distinguishes deterministic failure fixtures from real sandbox cancellations. Record each scenario and source; never imply all ten are genuine provider declines. T05 and T15 require actual provider transactions/events. T11 timeout fault injection surrounds a real capture when possible; any simulated provider behavior stays separately labeled.

## Non-goals

Live money, automatic refunds/payouts, tax advice, split payments, outreach, real client contracts, production financial accounts, unrelated CRM/accounting, or production-readiness claims. No autonomous payment agent. No sponsor SDK collection.

## Product flow

1. Authenticated freelancer enters synthetic client brief.
2. Server asks selected AI model for structured draft facts and ambiguity questions. Validate schema and display escaped text.
3. Freelancer resolves blocking questions, edits deliverables and commercial terms. AI output has no monetary authority.
4. Server computes totals with exact integer money rules and records explicit approval of an immutable revision.
5. Freelancer creates scoped buyer checkout link. Buyer reviews frozen quote and explicitly continues to PayPal sandbox for deposit approval.
6. Server creates Orders v2 order from frozen terms. Buyer approval permits server capture, but browser return conveys no payment proof.
7. Server validates completed capture against order, deposit, currency and configured merchant. Atomically stores evidence and marks engagement paid exactly once.
8. Verified webhook/reconciliation converges on the same evidence. Confirmed pre-capture cancellation or terminal failure stays unpaid; timeout/pending remains unresolved until verified. A cancellation observation racing with completed capture cannot override payment evidence.

## Proposed design boundaries

Architecture decision pending. Recommended: one TypeScript Next.js app with local SQLite. Alternatives: React/Vite plus Node API with SQLite; Next.js with managed Postgres/auth. No dependency installation or schema commitment before selection.

- Extraction service returns draft facts/questions only. No payment tools, secrets, arbitrary URL fetching or execution in model context.
- Quote service validates human-entered money. Initial proposal: USD-only, integer cents, positive deposit not exceeding quote total, no tax calculation. Approve currency scope with architecture/spec; broaden only if requested.
- Owner identity derives from authenticated server session. Proposed local judge mode uses explicitly provisioned demo owners, password hashing, HttpOnly session cookies, CSRF checks, resource ownership on every API route. Hosted access requires a later approved deployment/security decision.
- Buyer capability is random, narrowly scoped to one immutable quote and checkout attempt, stored hashed, expires and can be revoked. No owner APIs available to buyer.
- Payment service alone creates/captures orders. Persist request IDs and intended payloads before calls; separate create/capture keys; serialize competing operations.
- Evidence service verifies capture/merchant/order/amount/currency, authenticates webhooks before applying, deduplicates event IDs and capture IDs. Capture IDs cannot be reused across engagements. Do not trust client owner/order/merchant IDs. Acknowledge webhook with 2xx only after durable verified receipt or committed evidence transaction. Transient verification/storage failure stays retryable; restart processes persisted unhandled receipts.
- Each attempt permanently references approved revision and configured merchant. Draft edits cannot affect existing attempts. Engagement-wide guard permits at most one capture-eligible deposit attempt across all revisions and at most one paid deposit. Capturing, pending or unknown attempts reconcile before any replacement. Supersession invalidates unused buyer capabilities and blocks old revision checkout. Once a provider order exists, replacement requires verified non-capturable terminal state; a new draft alone never authorizes another deposit. A paid engagement cannot create another deposit.

## Proposed state contract

Keep quote approval separate from payment state.

| Domain | States and transitions |
| --- | --- |
| Quote | draft -> review_required -> approved immutable revision; human may create a new draft revision |
| Attempt | creating -> awaiting_buyer -> capturing -> paid after verified COMPLETED capture |
| Recovery | uncertain/pending -> reconcile existing order/capture -> paid or verified terminal failure |
| Cancellation | canceled/failed records intent or verified outcome; cannot overwrite a verified paid capture |

Browser cancellation is a UI observation, not authoritative provider finality. Late authenticated capture evidence still wins. Errors/timeouts never silently become unpaid terminal outcomes. Webhooks do not independently initiate a capture. Replays converge atomically on one paid record.

## API contract principles

Exact route schemas follow approved architecture in PLAN.md. Owner operations cover extraction, draft edit, approval, checkout creation and reconciliation. Buyer operations expose minimal approved quote and checkout status. Webhook route has provider authentication only, no browser session requirement. Browser submits a quote/revision reference, never authoritative payment amount. Payment state responses exclude secrets and unnecessary identities.

## Access/design decisions requiring human input

1. Architecture A/B/C and proposed owner/buyer boundaries.
2. Proposed USD-only initial scope and quote approval/payment states.
3. AI provider/model and approved usage budget. Existing Gemini metadata access verified; generation not performed.
4. Secure sandbox app credentials, business merchant, separate personal buyer; eventual webhook HTTPS access and registration authorization.
5. Entrant eligibility and later license/remote/publication choice.

## Delivery and evidence

Source/license/setup README, secure judge access instructions, fixtures, architecture diagram, measured results, English Devpost copy, actual tool inventory, sponsor rationale if used, 150-second demo script and checklist. Drafts describe only verified behavior. Main owns manifests, lockfiles, integration, final reviews, commits/pushes and external approvals. Workers cannot publish, alter access or spend money.

UI requirements: Geist Sans, accent #006bff, no orange, no emoji. Verify actual working and failed states in screenshots. Build sandbox path before interface polish.

## Primary payment references

[Orders integration](https://developer.paypal.com/api/rest/integration/orders-api), [capture](https://developer.paypal.com/api/orders/v2/orders-capture/), [idempotency](https://developer.paypal.com/api/rest/reference/idempotency/), [webhook verification](https://developer.paypal.com/api/webhooks/v1/verify-webhook-signature-post), [simulator limits](https://developer.paypal.com/api/rest/webhooks/simulator/), [sandbox accounts](https://developer.paypal.com/sandbox-testing/accounts).

Design self-review plus independent Sol review: acceptance criteria separated from implementation; non-goals explicit; unknown/pending distinct from terminal unpaid outcomes; payment evidence wins over cancellation observation; engagement-wide guard covers all revisions; webhook receipt durable before acknowledgement; authentic evidence must bind to exact attempt. Four material spec findings addressed. Unresolved decisions are approval gates, not assumed choices. PLAN.md follows design approval. No implementation audit performed.
