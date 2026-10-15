# Your PayPal Sandbox setup

Only Sandbox accounts and credentials are used. All3 genuine buyer approvals/captures and3 authentic completion webhooks verified on2026-10-15. No further buyer action is pending for these scenarios. Local app and public source are available; video remains an unpublished draft. No real money is involved in Sandbox tests.

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

Keep the secret and buyer password out of chat, source, screenshots and videos. Leave the webhook ID blank for a new installation until registration is verified. Load configuration into the intended Sandbox runtime; the public source supplies no credentials.

OAuth, separate Personal buyer access and configured Business merchant binding have been verified through3 genuine Sandbox payments. USD1/2/3 deposits against approved USD10/20/30 manual quotes each have exactly one completed capture. Canonical provider evidence matches persisted order, capture, merchant, amount and USD. A successful redirect alone does not prove payment.

Authentic webhook testing needs a public HTTPS endpoint. For a new installation, register `https://<approved-host>/api/webhooks/paypal` in the same Sandbox app, subscribe to `PAYMENT.CAPTURE.COMPLETED` and save the verified Webhook ID in `.env.local`. For the existing entrant setup, reuse the saved registration and renew its URL only; never create a duplicate hook. Local loopback cannot receive PayPal deliveries; simulator events do not satisfy authentic-event acceptance. [Official webhook guide](https://developer.paypal.com/api/rest/webhooks/rest/)

Current evidence2026-10-15:3 authentic PAYMENT.CAPTURE.COMPLETED events were verified through the registered hook, persisted and processed as paid, one per capture. T05 and T15 PASS. Normal USD2/3 buyer flows opened original fragment links before PayPal approval and returned to visible server-verified paid states. Existing buyer login was used without reading/outputting its password. No USD2/3 PNG files were exported; the USD1 paid-state screenshot remains private. Never replay completed create/capture helpers.

Independent security review confirmed all3 paid deposits/receipts and exact preservation of the original3 expired reservations and6 ready undispatched operations. Those historical local preparation fixtures are not the3 genuine completed transactions. The app remains private on loopback; a Business account cannot approve its own merchant checkout.

Current listener lifecycle: the temporary webhook-only proxy and tunnel were stopped after testing on2026-10-15, with no provider or database writes during cleanup. The app remained healthy on Node24.21.0 with AI disabled. The existing webhook ID stays saved; configured does not mean reachable. Future genuine captures require a new temporary listener, URL-only renewal of this same registration and exact readback before capture. Temporary exposure is not durable judge hosting.

Historical2026-10-13 setup: one Sandbox completion webhook was registered and read back. One exposure attempt failed DNS and stopped without a webhook update. Controlled recovery subsequently restored the receiver and renewed the existing registration, allowing the first genuine USD1 capture/event to complete. A direct-provider-link return initially lacked the buyer capability; the genuine paid-state UI was subsequently restored and captured. This history is superseded by the3/3 completed state above.

Before the remaining tests on2026-10-15,3 public route-restriction checks returned404 and canonical readback confirmed the same existing webhook URL/event subscription. No registration PATCH occurred that day. Broader provider race/fault/restart acceptance remains incomplete;3 verified payments do not establish those separate criteria.
