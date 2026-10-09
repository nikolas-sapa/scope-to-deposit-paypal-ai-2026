# Locked implementation contracts

Selected by delegated coordinator, 2026-10-08. Changes require main updating spec/plan and all dependent packets before implementation. Currency USD; constraints in shared LIMITS. Epoch milliseconds, UUID resource IDs; crypto tokens 32 random bytes, hashes persisted. Server context/types in src/server/context.ts, DTOs in src/shared/contracts.ts, schema in src/server/schema.sql.

## Module signatures

```ts
// config.ts
getConfig(env?: NodeJS.ProcessEnv): Config;
loadEnvironment(): void; // native Node .env.local load for scripts; absence allowed
// db.ts
openDatabase(path: string): DatabaseSync;
getDatabase(config: Config): DatabaseSync;
transaction<T>(db: DatabaseSync, fn: () => T): T; // reject async callbacks
// errors.ts
class AppError extends Error { code: ErrorCode; status: number }
// auth.ts
bootstrapCsrf(ctx: HttpContext): AuthResponse;
login(ctx: HttpContext, input: { username: string; password: string }): Promise<AuthResponse>;
logout(ctx: HttpContext): AuthResponse;
requireOwnerRead(ctx: HttpContext): OwnerPrincipal;
requireOwnerMutation(ctx: HttpContext): OwnerPrincipal;
requireBuyerRead(ctx: HttpContext): BuyerPrincipal;
requireBuyerMutation(ctx: HttpContext): BuyerPrincipal;
provisionOwner(db: DatabaseSync, username: string, password: string, now?: number): Promise<{ ownerId: string }>;
// engagements.ts
createEngagement(ctx: HttpContext, owner: OwnerPrincipal): EngagementDto;
listEngagements(ctx: HttpContext, owner: OwnerPrincipal): EngagementDto[];
getEngagement(ctx: HttpContext, owner: OwnerPrincipal, id: string): EngagementDto;
saveDraft(ctx: HttpContext, owner: OwnerPrincipal, id: string, input: { expectedVersion: number; draft: DraftInput }): EngagementDto;
approve(ctx: HttpContext, owner: OwnerPrincipal, id: string, input: { expectedVersion: number }): ApprovedQuote;
// paypal.ts
createPayPalGateway(ctx: HttpContext): PayPalGateway; // always real fixed-sandbox transport unless explicit test dependency injection
checkPayPalAccess(ctx: HttpContext): Promise<{ authenticated: boolean; sandboxOnly: true }>;
// payments.ts
issueCheckout(ctx: HttpContext, owner: OwnerPrincipal, id: string, input: { quoteId: string }): CheckoutLink;
revokeCheckout(ctx: HttpContext, owner: OwnerPrincipal, capabilityId: string): void;
getBuyer(ctx: HttpContext, buyer: BuyerPrincipal): BuyerDto;
createOrder(ctx: HttpContext, buyer: BuyerPrincipal): Promise<CheckoutDto>;
captureOrder(ctx: HttpContext, buyer: BuyerPrincipal): Promise<PaymentDto>;
observeCancel(ctx: HttpContext, buyer: BuyerPrincipal): PaymentDto;
reconcile(ctx: HttpContext, owner: OwnerPrincipal, id: string): Promise<PaymentDto>;
recoverUnresolved(ctx: HttpContext): Promise<void>; // authenticated internal work, no capture dispatch
// webhooks.ts
receiveWebhook(ctx: HttpContext, raw: Uint8Array, headers: Headers): Promise<{ status: 204 | 400 | 401 | 503 }>;
processReceipts(ctx: HttpContext, limit: number): Promise<void>;
// extraction.ts
extractScope(ctx: HttpContext, brief: string): Promise<ScopeExtraction>;
```

AppError constructor `(code: ErrorCode, message: string, status: number)`. Public error messages generic; never raw provider response or secret. Services return shared DTOs. Strict request parsing in main HTTP adapter plus validation inside service trust boundary.

## Route matrix

Owner requests authenticated by server-issued `scope_session` cookie. Every browser mutation requires exact APP_ORIGIN Origin, exact Host, `scope_csrf` cookie plus `X-CSRF-Token` matching stored session hash. Login needs anonymous bootstrap first. Buyer additionally sends `X-Checkout-Token`; no cookie or client owner/order ID supplies payment authority. No CORS wildcard or forwarded-host trust. Webhook exception uses provider authentication, bounded raw body.

| Method/path | Input | Output/auth |
| --- | --- | --- |
| GET /api/health | none | HealthDto, no secret values |
| GET /api/session | none | AuthResponse, creates anonymous CSRF session if necessary |
| POST /api/session | username,password | AuthResponse, Origin+CSRF; rotates session/CSRF |
| DELETE /api/session | empty | AuthResponse, owner mutation; expires session |
| GET /api/engagements | none | `{engagements: EngagementDto[]}`, owner read |
| POST /api/engagements | empty | EngagementDto, owner mutation |
| GET /api/engagements/:id | none | EngagementDto, owner read/ownership |
| PUT /api/engagements/:id/draft | expectedVersion,draft | EngagementDto, owner mutation/ownership |
| POST /api/engagements/:id/approve | expectedVersion | ApprovedQuote, owner mutation/ownership |
| POST /api/engagements/:id/checkout | quoteId | CheckoutLink, owner mutation/ownership |
| POST /api/engagements/:id/reconcile | empty | PaymentDto, owner mutation/ownership |
| DELETE /api/capabilities/:id | empty | `{revoked:true}`, owner mutation/ownership |
| POST /api/extract | brief | ScopeExtraction, owner mutation, AI usage gate |
| GET /api/buyer | none | BuyerDto, buyer read |
| POST /api/buyer/order | empty | CheckoutDto, buyer mutation |
| POST /api/buyer/capture | empty | PaymentDto, buyer mutation |
| POST /api/buyer/cancel | empty | PaymentDto observation only, buyer mutation |
| POST /api/webhooks/paypal | raw provider event | 204 durable verified receipt or 400/401/503 |

Paid only after verified COMPLETED capture. Unknown/pending HTTP202; ordinary success200; create201 permitted. Errors `{error:{code,message}}`. JSON body unknown fields rejected. Browser JSON body cap 1MiB; webhook raw body cap 256KiB, both enforced while streaming. Captures accept no buyer money/order field. Health booleans reflect configuration only, never account verification.

## Authentication and buyer flow

Anonymous session 15 minutes; owner session 8 hours; buyer capability 24 hours and revocable. Login rotates tokens; logout invalidates session. Random secrets hashed in DB. Cookie HttpOnly session, SameSite=Strict, Path=/, Secure only with HTTPS; explicit HTTP loopback allowed. Exact Host and Origin configured. Scrypt N131072/r8/p1/maxmem256MiB, salt16bytes/key64bytes, bounded concurrency and failed-login throttling.

Owner CheckoutLink includes non-secret `capabilityId` for the authorized DELETE /api/capabilities/:id revocation route. Checkout link `${APP_ORIGIN}/pay#<capability>`; buyer page puts token in tab sessionStorage and sends header only. No fragment sent to server or PayPal; Referrer-Policy no-referrer. PayPal return/cancel URLs `/pay?approved=1` and `/pay?canceled=1`, no capability. Same tab preserves capability. Reconciliation/webhooks independent from expired/revoked capability after provider dispatch.

## Payment invariants

Issue reserves attempt and stable operation keys before external calls. SQLite engagement-wide unique guard and one immutable paid_deposits record. Operation first dispatch/lease persisted before network, 15s transport timeout, lease30s. Confirmed create/capture key retention21600000ms (6h); no new keys/order after expiry or lost create uncertainty. Retry identical operation only within deadline. ProviderOperation carries the persisted retryUntil internally; gateway rechecks a conservative deadline margin after OAuth and immediately before each create/capture POST. Expired transport dispatch retains the original operation and engagement guard. No async transaction; positive verified payment evidence cannot regress due to late response/cancel.

Single purchase unit for approved deposit, configured merchant payee, intentCAPTURE, no live origin or client price. Fixed sandbox approval URL allowlist. Canonical provider normalization requires exact related order, merchant, gross cents, USD and completed capture; status alone insufficient. Missing binding evidence fails closed.

Internal server-only `reconcileWebhookReceipt(ctx, verifiedReceipt)` may connect webhook processing to targeted canonical-order GET/evidence application. It has no HTTP route or client export; input must come from verified persisted receipt processing, never browser data. It never dispatches capture.

Verify webhook through registered PayPal postback endpoint; require SUCCESS before receipt. Raw signed body retained privately in DB, never public evidence; log/error redaction. Event ID/body hash divergence rejected. Persist before204, replay processed receipt safe, pending receipt resumes. Webhook/reconcile never start capture. Tests may inject explicit transport fixtures through HttpContext.provider, labeled LOCAL_FIXTURE; product has no mock-payment mode.
