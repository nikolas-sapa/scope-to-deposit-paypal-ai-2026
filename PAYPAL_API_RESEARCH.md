# PayPal sandbox API research

As of 2026-10-08, official PayPal docs support a server-side Orders v2 checkout, but they do not prove this project can authenticate or meet its replay/cancellation evidence targets. Those require real sandbox runs with app credentials and a buyer account.

## Six research questions

### 1. Can Orders v2 create, get, and capture support a sandbox deposit?

Yes. Use sandbox REST base `https://api-m.sandbox.paypal.com`. Create with `POST /v2/checkout/orders`, `intent: CAPTURE`, and the server-computed approved amount; create returns an order ID and approval link. Buyer approves at PayPal; then server calls `POST /v2/checkout/orders/{id}/capture`. `GET /v2/checkout/orders/{id}` returns the order at any stage. Capture requires prior buyer approval unless a valid payment source is supplied. PayPal recommends server-side API calls. [Orders API guide](https://developer.paypal.com/api/rest/integration/orders-api), [create endpoint](https://developer.paypal.com/sdk/orders/v2/orders-create/), [get endpoint](https://developer.paypal.com/api/orders/v2/orders-get/), [capture endpoint](https://developer.paypal.com/api/orders/v2/orders-capture/)

Uncertainty: docs establish API behavior, not this app’s actual sandbox access or successful end-to-end transactions. No credentials supplied, so 3 real happy paths remain unverified.

### 2. What are idempotency semantics and retention?

`PayPal-Request-Id` is the documented idempotency header for supported POSTs. Orders capture endpoint lists it as optional. Orders docs say server retains key for 6 hours; callers may request up to 72 hours via Account Manager. General request docs describe replaying a request with same key to avoid duplicate actions and retrying network timeout/HTTP 500 while key remains retained. [Capture endpoint](https://developer.paypal.com/api/orders/v2/orders-capture/), [Orders expanded flow](https://developer.paypal.com/api/rest/integration/orders-api/api-use-cases/advanced/), [API requests](https://developer.paypal.com/api/rest/requests/)

Uncertainty: PayPal does not document a default retention suitable for 10 replay attempts beyond 6 hours. The app must also enforce its own immutable quote/payment state and durable idempotency so its one-transition/zero-duplicate-capture target does not depend only on PayPal retention. No replay run performed.

### 3. What errors should API integration surface and handle?

Orders common errors document 400 `INVALID_REQUEST`, 401 `AUTHENTICATION_FAILURE`, 403 `NOT_AUTHORIZED`, 404 `RESOURCE_NOT_FOUND`, 422 `UNPROCESSABLE_ENTITY`, 500 `INTERNAL_SERVER_ERROR`, and 503 `SERVICE_UNAVAILABLE`. A 422 may represent business validation failure. A timeout/500 can be ambiguous if a payment-side action completed; use same request ID on safe retries, then inspect order state. [Common Orders API errors](https://developer.paypal.com/api/rest/integration/orders-api/errors), [API requests](https://developer.paypal.com/api/rest/requests/)

Uncertainty: exact codes depend on request, account, and sandbox state. Do not assume every failure is retryable or that a mock error proves payment behavior.

### 4. Which webhook verification endpoint is supported, and what can simulator prove?

PayPal postback verification endpoint: `POST /v1/notifications/verify-webhook-signature`, sandbox base `https://api.sandbox.paypal.com`; request includes transmission headers, registered webhook ID, and webhook event. A subscribed listener must be HTTPS and return 2xx; PayPal retries failed deliveries up to 25 times over 3 days. [Webhook integration](https://developer.paypal.com/api/rest/webhooks/rest/), [webhooks overview](https://developer.paypal.com/api/rest/webhooks)

Simulator sends mock events, not tied to an App, not visible in dashboard event viewer, cannot be resent, and cannot be verified by posting to the PayPal verification endpoint. It uses special ID `WEBHOOK_ID`; it can exercise listener receipt/self-verification only. Real sandbox transactions needed to prove authentic postback verification. [Simulator docs](https://developer.paypal.com/api/rest/webhooks/simulator/)

Uncertainty: whether hackathon callback can expose a public HTTPS listener and register its webhook URL is environment-dependent. Simulator is insufficient evidence for real event delivery or verification.

### 5. What buyer flow and cancellation behavior does sandbox support?

Typical flow uses a sandbox Personal account as buyer and Business account as merchant. Buyer follows the create-order approval link, signs in with Developer Dashboard sandbox buyer credentials, approves, returns to app, then server captures. PayPal states sandbox uses fake accounts/test money. Closing/canceling before approval leaves order created and uncaptured; no money moves. [Sandbox accounts](https://developer.paypal.com/sandbox-testing/accounts), [Postman guide](https://developer.paypal.com/api/rest/postman/), [Next.js checkout guide](https://developer.paypal.com/guides/nextjs-checkout)

Uncertainty: 10 cancellations with unpaid state are not established by docs alone; must exercise the real buyer flow repeatedly and verify `GET` order state / business account activity for every case.

### 6. How to check API access before integration work?

Use Developer Dashboard sandbox Business account’s REST app credentials. Request OAuth 2.0 client-credentials access token from `https://api-m.sandbox.paypal.com/v1/oauth2/token`; then make a low-risk sandbox Orders API call, confirm expected auth/permission scopes and inspect API call logs. Orders endpoint specs show Client Credentials auth and sandbox token URL; common error docs distinguish 401 credential failure from 403 permission failure. [Authentication](https://developer.paypal.com/api/rest/authentication/), [get order endpoint](https://developer.paypal.com/api/orders/v2/orders-get/), [common Orders API errors](https://developer.paypal.com/api/rest/integration/orders-api/errors), [Postman guide](https://developer.paypal.com/api/rest/postman/)

Uncertainty: no credentials are available in this task, so live access, OAuth issuance, permission scopes, and API call log visibility are untested. No unrelated environment or secret search performed.

## Evidence status against requested acceptance targets

- 3 real sandbox happy paths: **not run**. Requires credentials, functioning app, and buyer approval.
- 10 replay attempts, exactly 1 state transition, 0 duplicate captures: **not run**. Must use stable request ID and inspect persisted app state plus PayPal capture/order state. Documented default PayPal key retention is 6 hours.
- 10 cancellations remaining unpaid: **not run**. Must cancel buyer flow and verify no capture for each order.
- Simulator cannot substitute for any of these transaction assertions or PayPal postback webhook verification.

## Product constraints carried into research

The docs support an architecture where the application computes an integer-money quote server-side, freezes the approved quote, and only creates/captures an order after explicit user approval. AI extraction has no authority to set price, approve, or capture. These are project constraints, not PayPal requirements.
