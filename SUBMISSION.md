# Scope to Deposit

October 16 AI status: 28 dispatches, 22 schema-accepted outputs and 35,857 reported tokens; two timeouts and two HTTP 402 responses lack usage. T01 FAIL (1/20), T14 incomplete (2/10); latest prompt has no accepted real output. Fresh access recheck returned HTTP 402 in 409 ms, cause unresolved. Source 1a5247f includes the 45-second AI deadline, PayPal unchanged; 172/172 tests, TypeScript and build PASS. Codex IAB works with authenticated Vyce. The reviewed 177.00-second video is published UNLISTED at https://youtu.be/tdFlgzJ0MXY; both YouTube checks completed with No issues, and Save confirmed publication at 2:57. The watch page confirms UNLISTED and working playback (177.021-second duration, no player error). Devpost accepted the video embed and saved the story, tags, GitHub URL and video through Save & continue, DRAFT 4/5. Additional information persisted on readback. No final project submission or judge-key sharing has occurred.

**Status: entry draft, updated October 16.** Source 1a5247f is public and Devpost registration is complete. The reviewed 177.00-second video is published UNLISTED at https://youtu.be/tdFlgzJ0MXY; both YouTube checks completed with No issues, and Save confirmed publication at 2:57. The watch page confirms UNLISTED and working playback (177.021-second duration, no player error). Devpost accepted the video embed and saved the story, tags, GitHub URL and video through Save & continue, DRAFT 4/5. Additional information persisted on readback. No final project submission or judge-key sharing has occurred.

## One-line pitch

Agree the scope. Freeze the quote. Verify the deposit.

## Project description

Scope to Deposit helps independent freelancers turn a client brief into a clear, editable scope and an explicitly approved quote before requesting a deposit. The freelancer can review deliverables, assumptions, timing, constraints, open questions, and USD line items in one workflow. A buyer checkout is tied to the approved quote revision, and the product treats payment as complete only after the server verifies provider evidence against the original order, merchant, deposit, and currency.

The local prototype supports manual scope editing and quote approval. AI extraction remains gated off in the running app. Real GLM evaluation returned schema-valid output for all 20 ordinary cases, but independent semantic T01 failed; T14 remains incomplete. Latest quality prompt timed out, and a minimal provider diagnostic returned HTTP 402 with unresolved cause. All 3 genuine PayPal Sandbox deposits (USD1/2/3 against approved USD10/20/30 quotes) completed buyer approval and exactly one capture each, with matching canonical order, capture, merchant, amount and USD evidence. Three authentic completion webhooks were verified, persisted and processed as paid.

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
- Vyce AI extraction has an exact GLM/DeepSeek allowlist and strict nested JSON shape. Real v1 outputs passed schema for 20 ordinary and 2 hostile cases, but semantic T01 failed and T14 is incomplete. Latest prompt has no accepted real output; generation stays disabled after timeout and unresolved provider HTTP 402.
- Local verification: current source run passed 172/172 tests, TypeScript and production build under Node24.21.0. Historical checks passed 15/15 production HTTP, 23/23 browser UI and a 33.59-second fresh-checkout setup/build/health run.

## Use of PayPal

PayPal Sandbox is the deposit provider. Three server-verified captures match frozen USD10/20/30 quotes and USD1/2/3 deposits, original orders, configured merchant and USD currency. Each order has exactly one completed capture. Three authentic completion webhooks were verified, persisted and processed against those captures. This is Sandbox evidence only. The temporary webhook listener was stopped after testing; future captures require a fresh listener and renewal/readback of the existing registration.

## Use of AI

The project includes a Vyce AI extraction adapter for facts and questions; it cannot approve quotes, set commercial terms or perform payments. Real GLM schema acceptance did not establish source-grounded quality: T01 failed, T14 incomplete. A reviewed quality correction has no accepted real output because its pilot timed out; subsequent provider diagnostic returned HTTP 402, cause unresolved. No further inference; private judge access remains unprovided.

## Credits and tools

The entrant source is MIT licensed. Five small UI primitives were adapted from official shadcn/ui registry sources under MIT; see `THIRD_PARTY_NOTICES.md`. Tool usage and model-assisted work are recorded in `TOOL_INVENTORY.md`.

## Remaining evidence before submission

- Resolve provider HTTP 402, then verify the reviewed quality correction and complete semantic acceptance before any working-AI claim. No further inference now; historical DeepSeek billing uncertainty is separate from the verified free GLM UI rate.
- Review the demo against all3 verified Sandbox captures and authentic receipts. USD1 screenshot remains private; USD2/3 paid states were observed through normal buyer returns, with no exported PNG files.
- Entrant declarations are complete: individual entry, adult/Greece, conflict/support response and ownership/required rights. Devpost event registration is verified complete; YouTube Studio upload availability was verified October 15. Codex IAB currently works with authenticated Vyce; browser reconnection is no longer a blocker. Devpost additional information and project details are saved, DRAFT 4/5; embed acceptance and persistence are verified. Official rules permit complete local setup/run instructions for judging; a hosted app is optional.
- Reviewed evidence video is published UNLISTED at https://youtu.be/tdFlgzJ0MXY (2:57); both checks completed with No issues and publication Save was confirmed. Devpost accepted the embed and saved story, tags, GitHub URL and video, DRAFT 4/5. Final entry submission and free judge access remain incomplete.
