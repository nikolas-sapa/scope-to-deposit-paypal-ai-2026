# Your PayPal Sandbox setup

Only Sandbox accounts and credentials are used. Local app, source, demo and private GitHub repository are ready. No real money is involved in Sandbox tests.

1. Sign in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
2. Open **Testing Tools → Sandbox Accounts**. Identify or create one **Business** account (merchant) and a separate **Personal** account (buyer). Keep buyer login details private; you will use that account to approve the test checkouts. [Official account guide](https://developer.paypal.com/sandbox-testing/accounts)
3. Open **Apps & Credentials → Sandbox**. Select or create a REST app associated with the Business account. Copy its **Client ID** and **Secret**. Use Sandbox credentials throughout. [Official REST setup](https://developer.paypal.com/api/get-started/)
4. Find the Business account's **PayPal Merchant ID** in its Business Information. This is the merchant's account identifier, not its email or the app's Client ID. [Merchant ID guidance](https://developer.paypal.com/docs/multiparty/seller-onboarding/build-onboarding/)
5. Put these values in the ignored `.env.local` file at this repository's root:

```dotenv
PAYPAL_CLIENT_ID=your_sandbox_app_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_app_secret
PAYPAL_MERCHANT_ID=your_business_sandbox_merchant_id
PAYPAL_WEBHOOK_ID=
```

Keep the secret and buyer password out of chat, source, screenshots and videos. Leave the webhook ID blank initially. Tell the coordinator when the local file is ready; the current review process deliberately overrides integration credentials, so configuration must be loaded into a restarted test runtime.

OAuth-only access has been verified. The user-provided Business Merchant ID is now stored in ignored local configuration, but has not been validated through a payment. After separate Personal Sandbox buyer access is confirmed and the runtime is configured, three distinct test deposits can be approved. The coordinator will check actual order/capture IDs, amount, USD and merchant evidence; a successful redirect alone does not prove payment.

Authentic webhook testing additionally needs a public HTTPS endpoint. Once its address is ready, register `https://<approved-host>/api/webhooks/paypal` in the same Sandbox app, subscribe to `PAYMENT.CAPTURE.COMPLETED`, and save the returned Webhook ID in `.env.local`. The coordinator will verify a genuine event and durable receipt. Local loopback cannot receive PayPal deliveries; simulator events do not satisfy authentic-event acceptance. [Official webhook guide](https://developer.paypal.com/api/rest/webhooks/rest/)

Checked 2026-10-12. Local Client ID, secret, and user-provided Business Merchant ID are configured; webhook ID remains unset. The OAuth-only Sandbox check returned `OAUTH_VERIFIED` before Merchant ID was added; no repeat call was made. No Sandbox app/account changes, order, capture, or webhook acceptance are claimed.

Three local checkout fixtures are now prepared for USD1/2/3 deposits. All79 preparation checks passed, but no PayPal order, buyer approval, capture, or genuine event has occurred. The prepared app remains private on loopback. A separate Personal Sandbox buyer account is still needed: Testing Tools → Sandbox Accounts → Personal account → View/Edit Account. Save its email/password in the coordinator-provided private `work/PLAN/sandbox-personal-buyer.json` file outside the repository, never in chat. The Business account cannot approve its own merchant checkout.
