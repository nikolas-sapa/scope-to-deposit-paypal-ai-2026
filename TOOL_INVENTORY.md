# Actual tool inventory

Status 2026-10-12: provider switch, local UI, delivery drafts, and timed fresh-checkout complete; external acceptance remains pending. Installed packages are recorded in package.json/package-lock.json; runtime verification in RESULTS.md.

| Tool | Actual use/status |
| --- | --- |
| Codex | Coordinator specification/contracts/scaffold; requested main exact model ID not exposed |
| gpt-6.1-sol, high | Backend auth/payment/extraction implementation, independent security/code reviews and fixes |
| gpt-6-luna, medium | Official API documentation, secure judge-access draft, 30 synthetic fixtures, evaluation protocol, Context7 retrieval, UI source lookup |
| Context7 ctx7@0.5.12 | Anonymous framework/library documentation retrieval; no login/setup/account changes |
| npm | Registry version/timestamp verification, pinned install respecting configured date cutoff, audit0 vulnerabilities |
| Next.js/React/TypeScript | Installed local full-stack framework; TypeScript check and production build pass with UI routes |
| Node25.8.1 node:sqlite | Real native schema initialization/transaction probe; 141 local tests include real native persistence/constraints/reopen checks |
| Zod | Installed schema validator; real safeParse probe succeeded |
| Geist/Tailwind/shadcn | Installed UI dependencies; five official MIT registry primitives retained with attribution; owner and buyer UI implemented |
| Vitest/Playwright Chromium | 141 service tests pass; 23/23 production-browser checks pass, zero unexpected console errors; screenshots retained in private session work |
| Fresh Git worktree | Node.js 25.8.1 / npm 11.11.0; clean `npm ci`, owner setup, typecheck, build, production health 200 in 33.59 seconds; PayPal/AI config false |
| Vyce AI | Authenticated model catalog returned HTTP200, 7 models, `deepseek-v4-flash` available. One direct synthetic-brief call returned HTTP200 (370 tokens, valid JSON); one application-adapter call failed behind the generic error boundary; exact failure stage is unknown. Exact rate/debit unknown; no more generation calls. AI remains disabled; see AI_SMOKE_RESULTS.md |
| Gemini, historical | Existing GEMINI_API_KEY passed metadata/countTokens lookup; `gemini-3.8-flash` returned HTTP400 for all three capped generation requests, zero validated outputs. US$0.051642 reserved, actual charges unknown. Replaced by Vyce; see AI_SMOKE_RESULTS.md |
| PayPal | Official sandbox Orders/webhook documentation reviewed; Client ID and secret are present in ignored local `.env.local`; Merchant ID and webhook ID blank. OAuth-only check returned `OAUTH_VERIFIED`; no order, capture or real event verified |

No Cursor requirement found in refreshed PayPal event rules/resources. No Cursor contribution claimed. No sponsor SDK included solely for an award. AG Grid not selected: bounded quote form does not require its financial-table capabilities. No sponsor-category claim currently made.

AI authorship is disclosed in this inventory. Model-assisted drafts do not establish originality/ownership or eligibility; human declarations remain pending. No API secrets or unrelated private material included in agent packets or intended public artifacts.
