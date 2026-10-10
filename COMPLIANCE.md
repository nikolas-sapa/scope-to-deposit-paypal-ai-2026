# Compliance preflight

Checked 2026-10-10, Europe/Athens. Local product/package preparation is complete; external acceptance evidence and human release decisions remain pending.

## Official requirements

| Requirement | Current finding |
| --- | --- |
| Submission window | October 1–November 12, 2026; deadline 12:00 PST, 22:00 Athens |
| Eligibility | Human confirmed adult age and Greece in another build chat. Entrant type, organizer/judge/conflict/support exclusions and ownership declarations remain unconfirmed |
| Required platform | Meaningful PayPal sandbox integration plus AI; sponsor tools optional |
| Development provenance | New project or significant update within window; record actual tools and changes |
| Cursor | No mandatory Cursor clause found in four reviewed event pages |
| Judge access | Functional runnable build, free access through December 15 |
| Repository | Public source, visible open-source license, complete setup instructions |
| Video/materials | Public YouTube demo under 3 minutes; English or translation |
| Judging | Implementation, design, impact, innovation, presentation equally weighted |
| Ownership | Entrant ownership and third-party rights required; promotional rights apply |

Sources: [rules](https://paypalaihackathon.devpost.com/rules), [overview](https://paypalaihackathon.devpost.com/), [resources](https://paypalaihackathon.devpost.com/resources), [FAQ](https://paypalaihackathon.devpost.com/details/faqs).

## Project commitments

- New scope-to-deposit product. Synthetic briefs and sandbox identities only.
- AI drafts scope and flags ambiguity. Human approval required for commercial terms and checkout.
- No live transactions, payouts, refunds, tax advice, outreach, real contracts, or unrelated CRM.
- Public repository never contains API secrets, session secrets, buyer passwords, or access tokens.
- Judge instructions explain secure provisioning/access. Sensitive judge access uses a private channel, subject to approved access design. No public API keys.
- Record all actual AI/build tools and their use, even absent a specific AI-disclosure clause. No fabricated evidence or provenance.
- No sponsor SDK unless useful. No sponsor-category claim currently selected.
- No registration, submission, deployment, publication, messaging, account changes, or spending without explicit authorization.

## Access and preparation gate

| Check | Evidence/result | Remaining prerequisite |
| --- | --- | --- |
| Workspace | Local branch `hackathon/paypal-preflight`; Next.js/SQLite app and docs implemented; production-browser checks 23/23; clean-checkout bootstrap/build/health completed in 33.59s | No local implementation prerequisite remains |
| PayPal network | Unauthenticated sandbox OAuth endpoint GET returned HTTP 401 | Sandbox merchant app credentials and buyer access; authenticated OAuth check |
| AI access | `GEMINI_MODEL=gemini-3.8-flash`; generation disabled by `AI_USAGE_ENABLED=false` | Explicit AI usage/budget approval, then real generation/evaluation |
| GitHub | `gh auth status` previously succeeded; repository has no remote | Human-selected remote and publication approval |
| Build tools | Clean checkout: Node 25.8.1, npm 11.11.0; install, owner setup, typecheck, production build, start and health 200 completed in 33.59s | No local build prerequisite remains |
| License | Root `LICENSE` is MIT; third-party notices retained | None for local package |
| Personal eligibility | Adult age and Greece confirmed by human, relayed by coordinating chat | Entrant type, conflict/support and ownership declarations; no identity documents needed |

No authenticated PayPal call, checkout, capture, real webhook, or model generation/evaluation completed. Browser screenshots, production-browser checks, clean-checkout setup, build, and independent TypeScript/security reviews are complete. No push, deployment, or submission occurred; repository has no remote.

## Preparation evidence

Luna API lookup: six primary-source questions in session `work/paypal-api-research.md`. Sol independent security preflight: quote immutability, ownership, capture verification, durable idempotency, timeout reconciliation, webhook authentication, AI and secret boundaries. Independent spec review raised four material findings: revision overlap, cancellation race, webhook acknowledgement durability, authentic-but-mismatched evidence. SPEC.md addresses all four with explicit invariants and numerical checks. Preparation review only; final code/security review still required.

Resumed preparation: JUDGE_ACCESS.md specifies custody and T08 account-provisioning-only exclusion. EVALUATION_DESIGN.md and 30 synthetic cases prepare measurable checks without calling a model or payment API. Follow-up Sol spec review found five further ambiguities; SPEC.md now covers approval rejection, capability expiry races, finite retry retention/lost-create recovery, provider-backed capture counts and authentication bypass checks. HANDOFF.md preserves architecture options and conditional worker ownership. No runtime test result inferred from these artifacts.

Official event rules, overview, resources, and FAQ rechecked on 2026-10-10. Product/architecture authority delegated by human; PLAN.md and CONTRACTS.md select A/USD without expanding spending/external-action permissions. Pinned dependency versions respect existing npm date cutoff. AI generation remains disabled pending authorized usage. Node 25.8.1 native SQLite transaction probe succeeded. UI primitive sources/license fetched from official shadcn registry. No authenticated PayPal/model-generation result inferred.

Refresh event pages again before submission. Keep final submitted build and access stable throughout judging.
