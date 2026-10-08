# Judge sandbox access handoff

**Status: proposal only.** No app architecture, hosting, credentials, account access, or access channel approved. No credential values belong in this file or public README.

## Access paths for later decision

**Own-sandbox local route:** judges use their own PayPal Developer sandbox app, Business merchant, and Personal buyer. They provision credentials locally and run a fresh checkout. App secrets remain on their machine. This avoids sharing account access. It requires setup steps and may not prove the entrant’s three stored sandbox transactions.

**Private hosted route:** entrant hosts a sandbox-only judge instance and grants access through a private channel. This needs a separate approval for hosting, account ownership, judge authentication, retention, and private credential delivery. Never put access tokens, passwords, session secrets, or private app credentials in a public README, issue, or source file. No hosted route authorized.

Architecture remains open: Next.js/SQLite, React+Node/SQLite, or managed Postgres/auth. This handoff does not select one.

## Credential and identifier custody

All labels below are proposed documentation/config labels only. **None is confirmed present or operative.** Do not create deployment configuration from this proposal.

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

1. Confirm a human-approved architecture and sandbox-only access mode. Confirm owner, merchant account, and buyer account custody. No account changes by this handoff.
2. Confirm a sandbox Business account and REST app already exist, or obtain separate approval for provisioning. Keep app secret with its owner. Give judges their own Personal buyer account; never share its password.
3. Before any checkout, verify OAuth token issuance with the sandbox client-credentials flow, then make a non-mutating authenticated Orders `GET` only when a valid sandbox order ID exists. Distinguish 401 credential/authentication failure from 403 permission failure. Record status and redacted request metadata, never token or Authorization header.
4. Confirm authorized Orders create/get/capture permissions and merchant binding using PayPal’s sandbox API logs and returned order/capture details. Do not infer access from an unauthenticated endpoint response or simulator event.
5. With a synthetic quote and explicit human approval, perform three buyer-approved sandbox orders and server captures. Persist redacted order/capture IDs, amount, currency, configured merchant match, status, and timestamps. Reconcile each order by API before calling it paid.
6. For authentic webhook evidence, approve HTTPS endpoint registration for the selected sandbox app, record its webhook ID server-side, receive a real sandbox capture event, and verify it with PayPal’s postback endpoint or documented cryptographic verification. Confirm the verified event maps to the same order, capture, merchant, amount, and currency. Simulator mock events can test listener plumbing only; they cannot prove postback verification or real transaction delivery.
7. Provide only the chosen access instructions through the approved channel. Public README may explain setup and credential names, but must contain no credential values or judge passwords. Redact tokens, cookies, buyer email, and unnecessary personal data from evidence.

## Provisioning time and setup benchmark

Only PayPal account and buyer-account provisioning are outside the 15-minute fresh-checkout setup benchmark (**T08**). Fresh-checkout app configuration, secure local secret configuration, package install, start, and bootstrap steps count. Document exact starting prerequisites and time the fresh checkout from a clean copy. Hosting choice/provisioning remains separately pending and is not an extra subtraction from T08. T15 webhook evidence is a separate test.

## Acceptance evidence links

- **T05, genuine sandbox checkout:** 3/3 distinct real buyer approvals and server captures, reconciled order/capture IDs, amount, currency, merchant, status, timestamps. Status: **NOT RUN**.
- **T08, judge setup:** fresh checkout in under 15 minutes, excluding account provisioning, with setup transcript and runtime versions. Status: **NOT RUN**.
- **T15, authentic webhook:** at least one real sandbox capture event passes registered webhook verification and converges on the existing capture. Status: **NOT RUN**. Simulator is not qualifying evidence.

## Cannot verify yet

1. Other participants' residence, majority and eligibility, plus any participant's disqualifying judge/organizer/support conflicts. Adult status and Greece residence are confirmed for the human entrant only; other participants need not reside in Greece.
2. Who owns or controls the PayPal Developer account, sandbox Business merchant, app credentials, Personal buyer account, and any webhook registration. Access and ownership remain unconfirmed.
3. Whether sandbox OAuth token issuance succeeds with this project’s app, and which permissions/scopes its merchant and app actually have.
4. Whether the selected app can create, retrieve, and capture orders for the intended merchant, or complete three genuine buyer-approved deposits.
5. Whether a public HTTPS webhook endpoint can be hosted, registered, reached by PayPal, and verified for a real sandbox capture event.
6. Whether local judge access or private hosted judge access will be selected and approved; no credentials or private access channel issued.
7. Whether a fresh checkout meets T08’s timing. No app exists yet; implementation and timing not authorized.
8. Whether any of T05, T08, or T15 acceptance criteria pass. All three are **NOT RUN**.

## Primary references

[PayPal OAuth and API authentication](https://developer.paypal.com/api/rest/authentication/), [Orders v2 integration](https://developer.paypal.com/api/rest/integration/orders-api), [capture endpoint](https://developer.paypal.com/api/orders/v2/orders-capture/), [sandbox accounts](https://developer.paypal.com/sandbox-testing/accounts), [webhook verification](https://developer.paypal.com/api/rest/webhooks/rest/), [webhook simulator limitations](https://developer.paypal.com/api/rest/webhooks/simulator/).

Internal context: [Compliance preflight](COMPLIANCE.md), [scope-to-deposit spec](SPEC.md), [PayPal API research](PAYPAL_API_RESEARCH.md).
