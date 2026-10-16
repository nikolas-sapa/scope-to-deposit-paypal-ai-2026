# AI validation history

Current status, October 16: 22 real GLM application-adapter outputs were accepted by the strict schema. The 20-case quality baseline failed, and only two of ten hostile outputs were reviewed before the batch stopped on a timeout. The latest source-grounding prompt correction is reviewed locally but unvalidated live. A subsequent minimal GLM infrastructure check returned HTTP 402 `insufficient_balance`, while metadata still reported positive credit and an enabled key. No further inference is being attempted. Earlier dated records below retain their original results.

## Bounded Gemini smoke, 2026-10-10

Result: **blocked, zero validated outputs**. Full T01/T14 model evaluation remains NOT RUN.

User assigned remaining technical work to the coordinator. A shared-key smoke used a maximum of three generation requests and a US$1 reserved ceiling, with no automatic retries. The production configuration remains `AI_USAGE_ENABLED=false`.

| Request | Brief | Change | Result |
| --- | --- | --- | --- |
| 1 | SYN-01 | Actual production adapter request | HTTP 400; smoke stopped |
| 2 | SYN-01 | Identical request hash; bounded private diagnostic capture | HTTP 400, `INVALID_ARGUMENT`, generic message |
| 3 | SYN-01 | Omit only `generationConfig.candidateCount` | HTTP 400, same generic error |

Each request passed authenticated `countTokens` first. Counted input was 212 tokens; conservative input reservation was 2,472 tokens and combined thinking/output ceiling 4,096. Cumulative reservation: **US$0.051642**, not an invoice or observed charge. No generation usage metadata was returned. Project billing tier and remaining quota were unavailable.

Official Gemini 3.8 migration guidance says to omit `candidate_count`; other Google documentation conflicts on whether one candidate is accepted. Removing it did not resolve this failure. Legacy `responseSchema` is documented in the API reference; deprecation alone does not establish the cause. The provider returned no field-level diagnosis.

On 2026-10-11, the production adapter omitted `candidateCount` as compatibility cleanup. Strict validation still accepts exactly one candidate, and the 4,096-token cap remains. The updated request regression failed against the frozen previous adapter (1 failure, 49 other passes), then all 139 server tests, TypeScript and production build passed with the patch. Independent TypeScript/security reviews approved. This is not a fix for the observed HTTP400; the third live request already tested the same omission and failed. No further generation calls were made.

Sources: [Gemini 3.8 migration](https://ai.google.dev/gemini-api/docs/generate-content/latest-model), [Generate Content API](https://ai.google.dev/api/generate-content), [structured output](https://ai.google.dev/gemini-api/docs/generate-content/structured-output), [pricing](https://ai.google.dev/gemini-api/docs/pricing).

Private evidence is retained outside the repository in session `work/PLAN/real-ai-smoke.json`, `real-ai-diagnostic.json`, and `real-ai-candidate-hypothesis.json`. Reports refuse replay. Eight billing-guard regressions and strict scratch TypeScript checks passed; independent TypeScript/security reviews approved bounded invocations.

## Vyce follow-up, 2026-10-12

A bounded validation allowance was authorized. The application remains configured with `AI_USAGE_ENABLED=false`. The model catalog still returns HTTP200 and lists `deepseek-v4-flash`; it provides no pricing fields. Vyce's [Terms of Service](https://vyceai.com/terms) state that per-token rates are displayed in the account dashboard; the public page gives no model rate. No authenticated Vyce dashboard session was available, so the exact rate and current debit remain unverified.

One short synthetic-brief generation returned HTTP200 with 370 total tokens and valid JSON containing the six expected top-level fields. Retained evidence records only the field names, four deliverables, six questions, and token counts; it does not retain the response envelope or field values. It was a direct provider smoke, not application acceptance. At [DeepSeek's published peak rates](https://api-docs.deepseek.com/quick_start/pricing/), the token-count estimate is about US$0.00035; this is not Vyce pricing, and its actual rate/debit is unknown. A following single call through `extractScope` failed at stage `application extraction`; any associated charge is unknown.

A post-run evidence audit found no retained HTTP status, content type, response envelope, `finish_reason`, transport error category, or Zod validation path for the app call. The local fixture expects `choices[0].message.content` containing JSON with required extraction fields and strict blocking-question fields. The retained direct-smoke summary lacks the envelope and question-item shapes needed to compare against those expectations. The failure could not be localized from available evidence. No speculative code change was made.

No further provider requests were made after the October 12 smoke until the separately bounded October 14 pilot below. Do not run the 30-case evaluator under the earlier authorization. Full T01 (20 ordinary cases), T14 (10 hostile cases), strict app-output validation, and rubric review remain NOT RUN. The cap is not enforced by an application-level aggregate spend ledger.

An offline diagnostic now exercises the actual Vyce adapter with eight injected transport fixtures, the disabled-config gate, and live-mode refusal. It passed89 assertions with zero network requests. Bounded metadata names the synthetic fixture fault only; the adapter intentionally masks provider failures, so these checks do not identify the historical live failure. A separate one-second harness deadline prevents an adapter-timeout regression from hanging the checks. Live mode remains unavailable until exact account rates and a bound covering billed reasoning/output are established.

## Vyce follow-up, 2026-10-14

The user supplied dashboard model cards, but the displayed rate unit could not be verified. One request using the selected `deepseek-v4-flash` model and synthetic fixture `SYN-01` was sent through the application adapter, with no retry and a 1,536-token output cap. Vyce returned HTTP429 `rate_limit_error` / `rate_limit_exceeded`; no token usage or output was returned. Application schema acceptance therefore did not occur. Actual debit is unknown. The request's conditional token-price estimate is not a billing cap because the rate unit and any billable reasoning scope are unverified.

The configured model was not changed, AI remains disabled, and no additional inference or 30-case evaluation was run. A read-only key-info response reported tier `free` but no balance, pricing unit, or explicit Lite/Pro entitlement. Do not substitute `deepseek-v4.1` based on its free-plan banner without verifying account entitlement. No retry until quota/reset and cumulative spend are clear.

## GLM application validation, 2026-10-16

Vyce displayed `glm-5.3-flash` as included at $0 per million tokens, with 10 million tokens/day. A user-approved dedicated key was created privately; readback confirmed a US$1 spend limit and 6 requests/minute. The shared key was unchanged.

Two bounded HTTP 200 pilots exposed missing nested-field instructions and a Markdown JSON wrapper despite JSON mode. The adapter now names the exact shape and accepts bare JSON or one anchored lowercase `json` fence, retaining strict DTO, response, timeout and authority boundaries. The subsequent baseline accepted 20 standard and 2 hostile outputs. Independent review scored 1/20 strict complete cases,29/46 labeled ambiguities and31/51 expected questions. T01 FAIL; T14 incomplete 2/10. A timeout stopped the batch before INJ-03 returned.

A reviewed three-instruction correction now prohibits unsupported assumptions, preserves source timing/counts and requests separate material clarifications. Its fresh pilot also timed out, so improved quality is unverified. One minimal provider diagnostic then returned HTTP 402 `insufficient_balance` in 752 ms. The same key metadata still reported enabled, positive credit, US$1/6request limits and 0 spend; its request counter also remained 0 despite real responses, so it is not invoice proof. No further inference is being attempted.

Across these GLM experiments: 27 chat-completion dispatches,22 accepted outputs,35,857reported tokens,2 timeouts without responses and1 HTTP 402 without usage. Failed STOP/claim evidence is immutable. Private quota accounting retains conservative holds for missing usage. No original financial database or PayPal provider was used by the isolated AI harness. Free judge AI access, the latest prompt rubric and final project submission remain incomplete.
