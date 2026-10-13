# Your PayPal Sandbox setup

Only Sandbox accounts and credentials are used. Local app, source, demo draft and public GitHub repository are ready. No real money is involved in Sandbox tests.

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

Checked2026-10-13. Client ID, secret, user-provided Business Merchant ID and verified webhook ID are stored in ignored local configuration. One Sandbox webhook for PAYMENT.CAPTURE.COMPLETED was created and confirmed through list readback, then activated in the loopback runtime. This required1 OAuth,1 create and2 list requests; no orders/captures or genuine events occurred. The temporary listener exposes only the webhook route and has rolling6/min,30/hour and120/process-lifetime admission limits; it is development infrastructure, not stable judge hosting.

Three historical local checkout fixtures were prepared for USD1/2/3 deposits; all79 preparation checks passed. Their expired reservations remain intact. Buyer now reports a separate Personal Sandbox account ready and will approve manually; no password file is required. A fresh manually approved USD10 synthetic quote produced one genuine USD1 Sandbox order through the application. Its official Sandbox approval link matches the persisted order. Buyer approval, capture and genuine event remain pending. The app stays private on loopback. Business account cannot approve its own merchant checkout.

Current listener lifecycle: the initial temporary HTTPS route was verified, but its proxy/tunnel processes have since exited. The webhook ID remains saved and the local app reports webhookConfigured=true. Before buyer-approved captures, renew the temporary listener and replace the URL on this one existing registration, then read it back. Never create duplicate hooks or call a stale URL delivery proof. No authentic event has been received.

Latest renewal attempt stopped after177 ENOTFOUND public probes; both owned processes stopped and no webhook API update occurred. One Sandbox order is awaiting buyer approval, with zero captures. Restore and verify receiver before capture. A return redirect is not payment evidence.

Subsequent controlled DNS recovery restored the receiver, updated the existing hook URL once and confirmed it by readback. First Personal buyer approval succeeded. Canonical API checks and one application capture produced a verified USD1 REAL_SANDBOX paid deposit, with one authentic capture webhook persisted and processed as paid. Original three reservations remain unchanged. Direct approval link had not seeded browser sessionStorage, causing missing-capability return UI; original fragment buyer link is preserved and queued for restoration without an approval query marker. Do not replay first order/capture scripts. Two additional genuine transaction scenarios remain pending.
