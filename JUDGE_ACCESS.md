# Judge sandbox access handoff

October 16 AI status: 28 GLM dispatches, 22 schema-accepted outputs and 35,857 reported tokens; two timeouts and two HTTP 402 responses lack usage. T01 remains FAIL (1/20 strict cases), T14 incomplete (2/10). The latest prompt has no accepted real output. Fresh access recheck returned HTTP 402 in 409 ms; cause unresolved. Published source 1a5247f uses a 45-second whole AI fetch/body deadline; PayPal timeouts are unchanged. Local 172/172 tests, TypeScript and production build PASS. Codex IAB works with authenticated Vyce. Judge key remains private, sharing unapproved. The reviewed 177.00-second video is published UNLISTED at https://youtu.be/tdFlgzJ0MXY; both YouTube checks completed with No issues, and Save confirmed publication at 2:57. The watch page confirms UNLISTED and working playback (177.021-second duration, no player error). Devpost accepted the video embed and saved the story, tags, GitHub URL and video through Save & continue, DRAFT 4/5. Additional information persisted on readback. No final project submission or judge-key sharing has occurred.

**Status 2026-10-16: local app implemented; judge usability remains unverified.** App architecture is Next.js/SQLite. Source is public; publication/submission are authorized. All 3 genuine Sandbox deposits and 3 authentic completion webhooks are verified; T05/T15 PASS. Own-sandbox local setup is the intended judge route, allowed by official rules. Free judge AI access remains unresolved. No credential values belong in this file or public README.

## Access paths for later decision

**Own-sandbox local route:** judges use their own PayPal Developer sandbox app, Business merchant, and Personal buyer. They provision credentials locally and run a fresh checkout. App secrets remain on their machine. This avoids sharing account access. It requires setup steps and may not prove the entrant’s three stored sandbox transactions.

**Private hosted route:** entrant hosts a sandbox-only judge instance and grants access through a private channel. This needs a separate approval for hosting, account ownership, judge authentication, retention, and private credential delivery. Never put access tokens, passwords, session secrets, or private app credentials in a public README, issue, or source file. No hosted route authorized.

The selected judge route remains own-sandbox local setup; no hosted judge instance exists. Free GLM UI rate was verified, but semantic T01 failed, T14 incomplete and current provider HTTP 402 remains unresolved. A user-approved dedicated capped key exists privately; permission to share it in a private Devpost field remains unanswered. No judge key has been delivered and free judge AI access is not complete.

## Credential and identifier custody

The local `.env.example` defines the listed PayPal and Vyce AI variable names with blank values. Entrant Sandbox credentials are configured only in ignored private local files; the public source contains no provisioned judge credentials. AI remains disabled. Do not create deployment configuration from this proposal.

| Type | Proposed label | Treatment and custody |
| --- | --- | --- |
| Sandbox app client secret | `PAYPAL_CLIENT_SECRET` | Secret. Server-side only. Store in local ignored config or approved secret store. Never expose in browser bundles, logs, screenshots, source control, or public README. Rotate/revoke if disclosed. |
| Sandbox app client ID | `PAYPAL_CLIENT_ID` | Identifier, not a credential by itself. May be browser-visible only if the eventual integration needs it. Prefer server configuration. Never treat it as proof of identity or authorization. |
| Sandbox merchant/account ID | `PAYPAL_MERCHANT_ID` | Identifier, not an app secret. Bind each payment attempt to the configured merchant and verify returned merchant evidence. Share only where needed for setup/review. |
| Sandbox buyer login/password | No app config label proposed | Account login credential. Keep with account owner; enter only at PayPal sandbox approval page. Never send to entrant, app, logs, screenshots, or public docs. Each judge should use a separate buyer account they control. |
| OAuth access token | No persistent config label proposed | Short-lived bearer credential. Runtime-only memory; never persist or print. Obtain using the sandbox app credentials. |
| Owner session cookie/signing secret | Proposed `SESSION_SECRET` | Secret. Server-only, unique per installation, secure/HttpOnly/SameSite cookie handling. Never reuse a PayPal credential or expose cookie contents. |
| Buyer checkout capability/session token | No fixed label proposed | Narrow, revocable, expiring capability for one immutable quote/attempt. Store hashed if persisted. Do not include it in public examples or logs. |
| Webhook listener URL | Proposed `PAYPAL_WEBHOOK_URL` | Endpoint address, not a secret. Register only after HTTPS listener and environment are approved. Avoid publishing private judge routes before access review. |
| Registered webhook ID | Proposed `PAYPAL_WEBHOOK_ID` | Verification configuration identifier, not a substitute for signature verification. Keep in server configuration; never confuse with client ID. |
| Webhook transmission headers/body | No fixed label proposed | Untrusted input until authentic verification succeeds. Preserve exact event for verification; redact sensitive personal/payment data from evidence and logs. |

## Safe preflight sequence

1. Architecture A and local sandbox-only access selected under delegated authority. Confirm owner, merchant account, and buyer account custody. No account changes by this handoff.
2. Confirm a sandbox Business account and REST app already exist, or obtain separate approval for provisioning. Keep app secret with its owner. Give judges their own Personal buyer account; never share its password.
3. OAuth token issuance and authenticated Sandbox Orders create/capture have been exercised successfully for3 genuine buyer-approved orders. Keep tokens and Authorization headers out of logs.
4. All3 completed captures match their intended orders, configured merchant, USD1/2/3 deposits and frozen USD10/20/30 quotes. Canonical evidence confirms exactly one completed capture per order.
5. Three authentic `PAYMENT.CAPTURE.COMPLETED` events arrived through the registered webhook and were verified, persisted and processed against their existing captures. Simulator events do not count toward this evidence.
6. Temporary receiver stopped after testing; existing webhook registration retained. Before future genuine captures, provision a fresh listener, renew only that registration's URL and confirm exact readback.
7. Provide only the chosen access instructions through the approved channel. Public README may explain setup and credential names, but must contain no credential values or judge passwords. Redact tokens, cookies, buyer email, and unnecessary personal data from evidence.

## Provisioning time and setup benchmark

Only PayPal account and buyer-account provisioning are outside the 15-minute fresh-checkout setup benchmark (**T08**). Fresh-checkout app configuration, secure local secret configuration, package install, start, and bootstrap steps count. Document exact starting prerequisites and time the fresh checkout from a clean copy. Hosting choice/provisioning remains separately pending and is not an extra subtraction from T08. T15 webhook evidence is a separate test.

## Acceptance evidence links

- **T05, genuine sandbox checkout:** **PASS2026-10-15,3/3** distinct real buyer approvals and server captures; canonical order/capture IDs, amount, USD, merchant and completed status match persisted evidence.
- **T08, judge setup:** fresh checkout in under 15 minutes, excluding account provisioning, with setup transcript and runtime versions. Local install, owner setup, typecheck, production build, start, and health check completed in 33.59s on Node 25.8.1/npm 11.11.0. PayPal credential setup/OAuth and judge usability were not exercised; overall T08 remains **NOT RUN**.
- **T15, authentic webhook:** **PASS**,3 authentic capture events passed registered webhook verification and converged on their existing captures. Simulator is not qualifying evidence. Broader fault/restart criteria remain separate and incomplete.

## Confirmed declarations and remaining gaps

1. Presented entrant declarations are complete: individual entry, adult/Greece, no organization connection in response to the question covering judge/organizer/sponsor, family/household and funding/support conflicts, and ownership/required rights. No teammates declared or additional unstated attestations inferred.
2. Who owns or controls the PayPal Developer account, sandbox Business merchant, app credentials, Personal buyer account, and any webhook registration. Access and ownership remain unconfirmed.
3. Whether the selected own-sandbox local route meets full provider-backed judge usability; no hosted instance or judge credentials issued. The entrant's3 verified transactions establish T05/T15, not judge usability.
4. Whether fresh-checkout setup with authorized PayPal credentials and judge access meets T08's full acceptance criteria. Local install/build/bootstrap took33.59s; provider setup and judge usability were not measured. Overall T08 remains **NOT RUN**.
5. Broader real-provider fault, replay and crash/restart acceptance remains incomplete. Temporary receiver has been closed; its historical success does not establish durable hosting.
6. Free judge AI access remains unverified. The latest quality prompt timed out and minimal diagnostic returned HTTP 402, despite enabled-key metadata; cause unresolved, no further inference. Codex IAB currently works with authenticated Vyce; browser reconnection is no longer a blocker.

## Primary references

[PayPal OAuth and API authentication](https://developer.paypal.com/api/rest/authentication/), [Orders v2 integration](https://developer.paypal.com/api/rest/integration/orders-api), [capture endpoint](https://developer.paypal.com/api/orders/v2/orders-capture/), [sandbox accounts](https://developer.paypal.com/sandbox-testing/accounts), [webhook verification](https://developer.paypal.com/api/rest/webhooks/rest/), [webhook simulator limitations](https://developer.paypal.com/api/rest/webhooks/simulator/).

Internal context: [Compliance preflight](COMPLIANCE.md), [scope-to-deposit spec](SPEC.md), [PayPal API research](PAYPAL_API_RESEARCH.md).
