# Scope to Deposit

**Status: entry draft.** Source repository is public. Event entry remains unsubmitted and the local video draft remains unpublished.

## One-line pitch

Agree the scope. Freeze the quote. Verify the deposit.

## Project description

Scope to Deposit helps independent freelancers turn a client brief into a clear, editable scope and an explicitly approved quote before requesting a deposit. The freelancer can review deliverables, assumptions, timing, constraints, open questions, and USD line items in one workflow. A buyer checkout is tied to the approved quote revision, and the product treats payment as complete only after the server verifies provider evidence against the original order, merchant, deposit, and currency.

The current local prototype supports manual scope editing and quote approval. AI extraction is implemented behind an explicit usage gate and remains disabled while app compatibility and account pricing are verified. PayPal Sandbox routes are implemented. Local Sandbox app Client ID and secret are set. The user-provided Business Merchant ID is stored in ignored local configuration; its use in a payment has not been verified. A Sandbox webhook has been registered, read back and activated in the local app. Its initial temporary HTTPS listener is stopped and needs URL renewal before capture testing; no genuine event is verified. Sandbox OAuth is verified. Buyer access, payment acceptance, and genuine webhook delivery remain unverified. The prototype therefore does not demonstrate or claim a genuine transaction or paid state.

## Problem

Freelancers often move from an informal brief to a deposit request before deliverables, assumptions, and unresolved questions are written down. That leaves both sides with avoidable ambiguity and makes a later payment state hard to interpret.

## Approach

Scope to Deposit keeps the sequence visible: capture the brief, review scope and blockers, edit commercial terms, approve a frozen revision, and only then create a buyer checkout capability. The backend owns quote totals, order creation, capture, reconciliation, and payment evidence. A browser redirect is treated as an observation, never proof of payment.

## Current implementation

- Next.js App Router, React, TypeScript, and local SQLite.
- Owner login/logout and resource ownership checks.
- Manual scope, assumptions, constraints, questions, and bounded USD line items.
- Explicit quote approval and immutable revisions.
- Buyer route designed around a fragment capability stored per tab and sent only in `X-Checkout-Token`.
- PayPal Sandbox Orders, capture verification, reconciliation, and durable webhook receipt services implemented; genuine provider acceptance remains pending.
- Vyce AI extraction is implemented behind a disabled-by-default gate. A direct synthetic-brief smoke returned HTTP200, but a single application-adapter call failed behind a generic error boundary; exact failure stage is unknown; no accepted app output or rubric evidence exists.
- Local verification: current 141/141 service tests, TypeScript, production build; historical 15/15 production HTTP checks, 23/23 production-browser UI checks, and 33.59-second fresh-checkout install/build/health run.

## Use of PayPal

PayPal Sandbox is the intended deposit provider. The server creates and captures sandbox Orders v2 against the frozen quote. The server must verify a completed capture against the exact order, merchant, amount, and USD before showing a paid state. Current provider-backed checkout evidence is `NOT RUN`.

## Use of AI

The project includes a Vyce AI extraction adapter for source-grounded facts and questions. It cannot approve a quote, set commercial terms, or perform payment actions. A direct synthetic-brief call returned valid JSON, but the application adapter did not accept its follow-up response. Generation remains disabled; model quality, app integration, and the 20-brief rubric are not verified. Vyce pricing and actual charges remain unknown.

## Credits and tools

The entrant source is MIT licensed. Five small UI primitives were adapted from official shadcn/ui registry sources under MIT; see `THIRD_PARTY_NOTICES.md`. Tool usage and model-assisted work are recorded in `TOOL_INVENTORY.md`.

## Remaining evidence before submission

- Complete genuine sandbox buyer approvals/captures and genuine registered-webhook event verification after buyer access is provided.
- Complete the real-model 20-brief rubric after usage authorization.
- Capture genuine paid-state evidence only from provider-verified records.
- Confirm remaining entrant declarations and authenticated Devpost/YouTube access. Official rules permit complete local setup/run instructions for judging; a hosted app is optional.
- Record and review final provider-backed evidence before video publication and event submission. The user authorized finishing and submission; factual entrant declarations remain pending.
