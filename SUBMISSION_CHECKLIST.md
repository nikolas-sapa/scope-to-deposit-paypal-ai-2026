# Submission checklist

**Draft checklist. Nothing has been published or submitted.**

## Local package

- [x] Source builds and TypeScript checks pass.
- [x] 139 local service tests pass; 23/23 production-browser checks cover owner workflow, capability handling, logout, missing-provider behavior, and responsive layout.
- [x] README documents the actual setup and sandbox-only boundaries.
- [x] MIT notice retained for the five adapted shadcn/ui primitives.
- [x] Browser bundle scan found no private config names or generated owner password.
- [ ] Complete a timed clean-checkout setup run after final review; record runtime and elapsed time.
- [ ] Re-run verification after any change to the recorded build.

## External acceptance evidence

- [ ] Obtain authorized PayPal Sandbox app credentials, Business merchant, and separate Personal buyer access.
- [ ] Complete three real buyer approval/capture scenarios and verify order, capture, amount, USD, and merchant.
- [ ] Register an HTTPS webhook after authorization; verify one authentic sandbox event and durable receipt handling.
- [ ] Obtain explicit AI usage/budget authorization before setting `AI_USAGE_ENABLED=true` or running real generation.
- [ ] Run the 20-brief source-grounded extraction rubric and review every output.
- [ ] Capture review-required, genuine paid, and canceled/failed unpaid screenshots from their actual states. Never synthesize paid evidence.
- [ ] Keep provider/model evidence labeled `REAL_SANDBOX`, `REAL_MODEL`, or `LOCAL_FIXTURE` as appropriate.

## Human decisions and release

- [ ] Confirm entrant eligibility, current event rules/deadline, and any required declarations.
- [ ] Review the final project description and 150-second demo against only verified behavior.
- [ ] Choose whether to create/select a remote and publish the repository.
- [ ] Record the demo video and review its content.
- [ ] Approve any public repository, video, or event submission before publishing.

Current status: no Git remote, public repository, deployment, video, or event submission is configured or authorized.
