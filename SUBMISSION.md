# Scope to Deposit

**Status: entry draft.** Source repository is public. Event entry remains unsubmitted and the local video draft remains unpublished.

## One-line pitch

Agree the scope. Freeze the quote. Verify the deposit.

## Project description

Scope to Deposit helps independent freelancers turn a client brief into a clear, editable scope and an explicitly approved quote before requesting a deposit. The freelancer can review deliverables, assumptions, timing, constraints, open questions, and USD line items in one workflow. A buyer checkout is tied to the approved quote revision, and the product treats payment as complete only after the server verifies provider evidence against the original order, merchant, deposit, and currency.

The local prototype supports manual scope editing and quote approval. AI extraction is implemented behind an explicit usage gate and remains disabled. A bounded Vyce `deepseek-v4-flash` application-adapter request returned HTTP429 before app output validation; usage metadata was absent, so debit is unknown. Account pricing unit and quota/reset are unverified. No retry or rubric run is authorized by the current $5 cap. All3 genuine PayPal Sandbox deposits (USD1/2/3 against approved USD10/20/30 quotes) completed buyer approval and exactly one capture each. Canonical order, capture, merchant, amount and USD evidence match persisted payment records. Three authentic registered `PAYMENT.CAPTURE.COMPLETED` webhooks were verified, persisted and processed as paid. Normal buyer returns for USD2/3 visibly showed server-verified payment.

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
- PayPal Sandbox Orders, capture verification, reconciliation and durable webhook receipt services implemented. All3 genuine captures and3 authentic completion webhooks verified on2026-10-15; T05 and T15 PASS. Broader provider fault criteria remain incomplete.
- Vyce AI extraction is implemented behind a disabled-by-default gate. A direct synthetic-brief smoke returned valid JSON. The bounded app-adapter request returned HTTP 429 rate limit, with no usage metadata or accepted app output. Pricing unit, quota/reset, and debit are unknown; no rubric evidence exists.
- Local verification: historical2026-10-12 full run passed141/141 service tests, TypeScript and production build;15/15 production HTTP checks,23/23 production-browser UI checks and33.59-second fresh-checkout install/build/health run.

## Use of PayPal

PayPal Sandbox is the deposit provider. Three server-verified captures match frozen USD10/20/30 quotes and USD1/2/3 deposits, original orders, configured merchant and USD currency. Each order has exactly one completed capture. Three authentic completion webhooks were verified, persisted and processed against those captures. This is Sandbox evidence only. The temporary webhook listener was stopped after testing; future captures require a fresh listener and renewal/readback of the existing registration.

## Use of AI

The project includes a Vyce AI extraction adapter for source-grounded facts and questions. It cannot approve a quote, set commercial terms, or perform payment actions. A direct synthetic-brief call returned valid JSON. The bounded application-adapter call returned HTTP 429 with no usage metadata; model quality, app integration, and the 20-brief rubric are not verified. Account pricing unit, quota/reset, and actual debit remain unknown. Generation remains disabled.

## Credits and tools

The entrant source is MIT licensed. Five small UI primitives were adapted from official shadcn/ui registry sources under MIT; see `THIRD_PARTY_NOTICES.md`. Tool usage and model-assisted work are recorded in `TOOL_INVENTORY.md`.

## Remaining evidence before submission

- Resolve Vyce quota and billing unit before any further API call; remain within the user-set US$5 cap. Then decide whether a real-model rubric is feasible.
- Review the demo against all3 verified Sandbox captures and authentic receipts. USD1 screenshot remains private; USD2/3 paid states were observed through normal buyer returns, with no exported PNG files.
- Confirm remaining entrant declarations and authenticated Devpost/YouTube access. Official rules permit complete local setup/run instructions for judging; a hosted app is optional.
- Record and review final provider-backed evidence before video publication and event submission. The user authorized finishing and submission; factual entrant declarations remain pending.
