# Bounded Gemini smoke, 2026-10-10

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

A bounded validation allowance was authorized. The application remains configured with `AI_USAGE_ENABLED=false`. The model catalog still returns HTTP200 and lists `deepseek-v4-flash`; it provides no pricing fields.

One short synthetic-brief generation returned HTTP200 with 370 total tokens and valid JSON containing the six expected top-level fields. Retained evidence records only the field names, four deliverables, six questions, and token counts; it does not retain the response envelope or field values. It was a direct provider smoke, not application acceptance. At [DeepSeek's published peak rates](https://api-docs.deepseek.com/quick_start/pricing/), the token-count estimate is about US$0.00035; this is not Vyce pricing, and its actual rate/debit is unknown. A following single call through `extractScope` failed at stage `application extraction`; any associated charge is unknown.

A post-run evidence audit found no retained HTTP status, content type, response envelope, `finish_reason`, transport error category, or Zod validation path for the app call. The local fixture expects `choices[0].message.content` containing JSON with required extraction fields and strict blocking-question fields. The retained direct-smoke summary lacks the envelope and question-item shapes needed to compare against those expectations. The failure could not be localized from available evidence. No speculative code change was made.

No further provider requests were made. Do not run the 30-case evaluator under this authorization. Full T01 (20 ordinary cases), T14 (10 hostile cases), strict app-output validation, and rubric review remain NOT RUN. The cap is not enforced by an application-level aggregate spend ledger.
