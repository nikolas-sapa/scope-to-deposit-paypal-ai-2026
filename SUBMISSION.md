# Scope to Deposit

**Status: draft only.** No entry, repository, or video has been published or submitted.

## One-line pitch

Agree the scope. Freeze the quote. Verify the deposit.

## Project description

Scope to Deposit helps independent freelancers turn a client brief into a clear, editable scope and an explicitly approved quote before requesting a deposit. The freelancer can review deliverables, assumptions, timing, constraints, open questions, and USD line items in one workflow. A buyer checkout is tied to the approved quote revision, and the product treats payment as complete only after the server verifies provider evidence against the original order, merchant, deposit, and currency.

The current local prototype supports manual scope editing and quote approval. AI extraction is implemented behind an explicit usage gate and remains disabled pending authorized usage. PayPal Sandbox routes are implemented. Local Sandbox app Client ID and secret are set; Business Merchant ID and webhook ID remain unset. OAuth, merchant account, buyer access, and registered HTTPS webhook are unverified. The prototype therefore does not demonstrate or claim a genuine transaction or paid state.

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
- Vyce AI extraction returns facts/questions only and defaults to disabled; no real generation was performed.
- Local verification: current 140/140 service tests, TypeScript, production build; historical 15/15 production HTTP checks, 23/23 production-browser UI checks, and 33.59-second fresh-checkout install/build/health run.

## Use of PayPal

PayPal Sandbox is the intended deposit provider. The server creates and captures sandbox Orders v2 against the frozen quote. The server must verify a completed capture against the exact order, merchant, amount, and USD before showing a paid state. Current provider-backed checkout evidence is `NOT RUN`.

## Use of AI

The project includes a Vyce AI extraction adapter for source-grounded facts and questions. It cannot approve a quote, set commercial terms, or perform payment actions. Generation remains disabled. The verified demo uses manual editing. No Vyce generation has been tested; rate and spend remain unverified.

## Credits and tools

The entrant source is MIT licensed. Five small UI primitives were adapted from official shadcn/ui registry sources under MIT; see `THIRD_PARTY_NOTICES.md`. Tool usage and model-assisted work are recorded in `TOOL_INVENTORY.md`.

## Remaining evidence before submission

- Complete genuine sandbox buyer approvals/captures and registered webhook verification after access is provided.
- Complete the real-model 20-brief rubric after usage authorization.
- Capture genuine paid-state evidence only from provider-verified records.
- Recheck entrant eligibility, deadline, event rules, repository access, and publication choice.
- Record and review the final video, then obtain human approval before publication or submission.
