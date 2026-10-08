# Compliance preflight

Checked 2026-10-08, Europe/Athens. Status: preparation only, not submission ready.

## Official requirements

| Requirement | Current finding |
| --- | --- |
| Submission window | October 1–November 12, 2026; deadline 12:00 PST, 22:00 Athens |
| Eligibility | Legal majority; geographic and organizer/judge/conflict exclusions apply to every participant. Human attestation pending |
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
| Workspace | Empty project directory, no existing source, Git repo or `.env` | Approve design, then implement |
| PayPal network | Unauthenticated sandbox OAuth endpoint GET returned HTTP 401 | Sandbox merchant app credentials and buyer access; authenticated OAuth check |
| AI access | Existing `GEMINI_API_KEY`; model-list GET returned HTTP 200 with 45 generation-capable models | Approve provider/model and usage budget; real generation/evaluation |
| GitHub | `gh auth status` successful | Human-selected remote and publication approval |
| Build tools | Node 25.8.1, npm 11.11.0 available | Verify chosen packages/runtime support before install |
| Models | Explicit Luna/medium research and Sol/high security preflight spawned successfully | Main exact model ID not exposed; GPT-6 identity cannot confirm gpt-6.1-sol |
| Required skills | Brainstorming found in installed superpowers 6.2.0 plugin cache | Approved design/spec before writing-plans/implementation |
| Context7 | No callable Context7 tools found | Enable required docs access before framework code |
| Global references | Referenced skill catalog, MCP guide, agent governance absent at supplied paths | Reported missing; supplied AGENTS instructions retained |
| Personal eligibility | Asked, no attestation yet | Residence, majority, entrant type, conflict/support confirmation |

No authenticated PayPal call, checkout, capture, real webhook, evaluation, screenshot, fresh-checkout setup, code audit, push, deployment or submission completed.

## Preparation evidence

Luna API lookup: six primary-source questions in session `work/paypal-api-research.md`. Sol independent security preflight: quote immutability, ownership, capture verification, durable idempotency, timeout reconciliation, webhook authentication, AI and secret boundaries. Independent spec review raised four material findings: revision overlap, cancellation race, webhook acknowledgement durability, authentic-but-mismatched evidence. SPEC.md addresses all four with explicit invariants and numerical checks. Preparation review only; final code/security review still required.

Refresh event pages before implementation and again before submission. Keep final submitted build and access stable throughout judging.
