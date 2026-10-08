# Implementation handoff, awaiting design approval

Preparation artifact only. No stack, schema, dependency or deployment choice selected. No application source exists. PLAN.md follows explicit approval of SPEC.md and architecture; this handoff is not permission to implement.

## Decisions preserved

| Option | Benefit | Cost/tradeoff |
| --- | --- | --- |
| A: Next.js + SQLite (recommended) | One local server; compact judge setup | Hosting requires later persistent-storage decision |
| B: React/Vite + Node API + SQLite | Explicit browser/server boundary | Extra build/runtime setup |
| C: Next.js + managed Postgres/auth | Shared hosted access easier | Vendor, account, hosting and cost decisions |

USD-only integer cents remains a proposal. Initial deposit must be positive and no greater than server-computed approved quote total. AI provider/model and usage budget remain unselected; existing Gemini key has only passed metadata access. No spend authorized.

## Shared behavioral contract

1. Extraction accepts synthetic brief text and returns validated draft facts plus blocking ambiguity questions. Evidence must ground facts in the source. It cannot set authoritative money, approve quotes, identify owners, create/capture orders, or change paid status.
2. Owner operations derive identity from authenticated server context. Every operation checks resource ownership. Money comes from validated owner edits, never extraction output or buyer input.
3. Approval snapshots exact revision, commercial terms, approving owner and timestamp. Blocking ambiguities must be resolved. Existing snapshots and their attempt bindings never mutate.
4. Buyer capability grants minimal access to one approved revision/attempt. It does not grant owner privileges. Explicit buyer continuation precedes sandbox order creation; PayPal buyer approval precedes capture. Check capability validity before dispatch; expiry/revocation never suppresses evidence from dispatched operations or releases their guard.
5. Payment service checks explicit revision approval and resolved ambiguities before every create/capture dispatch, then persists intended payload and separate stable create/capture request IDs before network calls. Operations serialize under an engagement-wide deposit guard. At most one capture-eligible attempt exists across all revisions, and at most one deposit can become paid. Retry identical keys/payloads only within confirmed retention; lost create response or expired retention remains guarded until authoritative reconciliation/reviewed resolution.
6. Evidence must bind completed capture to exact configured merchant, order, amount and currency. Provider capture ID cannot belong to multiple engagements. Callback query parameters, approval redirects and cancellation observations grant no evidence authority.
7. Unknown/pending outcomes block replacement charges. Reconcile the original attempt. Cancellation cannot overwrite verified completed capture. A new draft revision cannot bypass the engagement deposit guard.
8. Authenticate webhook before payment effects. Deduplicate event IDs and capture IDs. Acknowledge only after durable verified receipt or committed evidence transaction; persisted unapplied receipts resume after restart. Browser capture responses, webhook and reconciliation converge on one paid transition.

## Conditional work ownership

These are reserved module responsibilities for PLAN.md, not files created or framework contracts chosen. Main confirms exact filenames after architecture selection. Workers cannot alter shared contracts or manifests.

| Work packet | Requested model/role | Exclusive proposed paths | Prerequisites and completion gate |
| --- | --- | --- | --- |
| Integration shell/storage contract | Main Sol | Route/framework adapters, schema specification, manifests/lockfiles, PLAN.md, TASKS.md | Approved stack; Context7; verified package versions; explicit interfaces |
| Payments and owner/buyer boundaries | gpt-6.1-sol, high, backend | `src/payments/**`, `src/auth/**`, `tests/payments/**`, `tests/auth/**` | Approved auth/data contract and real sandbox access; T02–T07, T09–T13, T15, T17–T20 |
| Brief/quote/status interface | gpt-6-luna, medium, frontend | `src/ui/**` | Approved routes/types and design tokens; T16; no payment invariants or schema edits |
| Extraction and evaluation | gpt-6-luna, medium, bounded worker | `src/extraction/**`, `tests/extraction/**`, `fixtures/**` | Approved model/schema/budget; T01/T14; fixtures are inputs, not proof of a working model |
| Code review | gpt-6.1-sol, high, typescript-reviewer | Read-only | Runnable integrated implementation; material findings fixed |
| Security review | gpt-6.1-sol, high, security-reviewer | Read-only | Runnable integrated implementation; auth/payment/secrets/replay/agent audit |
| Delivery drafts | gpt-6-luna, medium | Main-assigned README/submission/demo files only | Main-verified actual results; no claims from mocks alone |

Maximum main plus three children. No child spawning. Main integrates edits, owns all commits/pushes and external approvals. Workers preserve concurrent edits and touch only assigned files. Any unclear contract stops that packet for main clarification; Luna escalates after one substantive failure. Reviews start after runnable dependencies exist.

## Sequence after approval

Tests precede implementation planning in SPEC.md. Next: writing-plans skill, finalized schemas/routes/auth and test packets, dependency version checks, sandbox OAuth/permission preflight, then payment path before UI polish. Context7 documentation access is required before framework code. No secrets appear in agent handoffs, logs, public source or submission artifacts.

Complete independent implementation packets only after their dependencies pass. Main then runs all applicable T01–T20, three genuine sandbox approvals/captures, authentic webhook verification, UI screenshots and timed fresh checkout. Count provider captures across all scenario orders and lifetime separately from local state transitions. Real payment/recovery claims require genuine sandbox operations, not fixtures. Commission independent code/security review, fix material findings, then draft submission from evidence. No passing test is rerun absent a change/failure/remaining concern.

## Current verifiable preparation

- Local Git preflight exists; no remote selected, no push/publication.
- Adult age and Greece facts confirmed by human in coordinating build chat. No unconfirmed declaration inferred.
- PayPal unauthenticated endpoint reachable in earlier preflight; this is not OAuth/account evidence.
- Existing `GEMINI_API_KEY` passed model-list access in earlier preflight. Generation and evaluation remain NOT RUN.
- Required skills context retained. No Context7 callable tools found; no framework code written.
- Architecture-neutral access/evaluation documents and synthetic data can be prepared without Context7, PayPal credentials or model spending. Executable application, actual model evaluation and genuine sandbox evidence cannot yet be completed.

## Exact remaining inputs

| Input/action | Why needed | Safe form |
| --- | --- | --- |
| Select A/B/C and approve SPEC.md, including USD-only scope and owner/buyer/payment boundaries | Required architecture and brainstorming design gate | Architecture letter plus approval/amendments |
| Enable Context7 docs access | Mandatory before framework implementation | Connected callable tools; no API key pasted in chat |
| Identify secure existing sandbox app credential location | OAuth and real Orders access | Local path or variable names only; proposed names documented in JUDGE_ACCESS.md |
| Confirm sandbox Business merchant and separate Personal buyer access | Three genuine checkout/capture checks | Access/custody confirmation; password entered only in PayPal sandbox |
| Approve AI provider/model and usage budget | Real extraction and 20-case evaluation | Provider/model plus explicit spending cap or authorized free tier |
| Confirm entrant type, conflict/support exclusions and original-work ownership | Eligibility/submission compliance | Attestation; adult/Greece need not be repeated |
| Later approve HTTPS webhook access/registration | Real authenticated event delivery for T15 | Approved endpoint/app and secure webhook configuration |
| Later choose license/remote and approve external publication/submission | Public repository/video/access required for final submission | Review concrete completed artifacts before approval |

No registration, submission, deployment, publication, messages, paid generation or live transactions authorized. Sandbox implementation/testing remains within requested scope once design and necessary access are settled.
