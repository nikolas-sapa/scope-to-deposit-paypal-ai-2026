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

Next coordinator work: establish an accepted request using provider/account diagnostics, then rerun extraction and the source-grounded rubric within a separately bounded allowance. No further calls under this exhausted three-request allowance. Transport or fixture success cannot pass T01 (20 ordinary cases) or T14 (10 hostile cases).
