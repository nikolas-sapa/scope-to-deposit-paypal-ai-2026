import type { DatabaseSync } from "node:sqlite";
import type { Currency } from "../shared/contracts";

export interface Config {
  appOrigin: string; databasePath: string;
  paypalClientId: string; paypalClientSecret: string; paypalMerchantId: string; paypalWebhookId: string;
  geminiApiKey: string; geminiModel: string; aiUsageEnabled: boolean;
}
export interface OwnerPrincipal { ownerId: string }
export interface BuyerPrincipal { capabilityId: string; attemptId: string; quoteId: string }
export interface ProviderCapture { id: string; status: string; orderId: string; merchantId: string; amountCents: number; currency: string }
export interface ProviderOrder {
  id: string; status: string; merchantId: string; amountCents: number; currency: string;
  approvalUrl: string | null; captures: ProviderCapture[];
  provenance: "REAL_SANDBOX" | "LOCAL_FIXTURE";
}
export interface VerifiedWebhook { eventId: string; eventType: string; resourceId: string; orderId: string | null; rawBody: string; bodyHash: string }
export interface ProviderOperation { requestId: string; payload: Record<string, unknown>; retryUntil: number; orderId?: string }
export interface PayPalGateway {
  createOrder(operation: ProviderOperation): Promise<ProviderOrder>;
  getOrder(orderId: string): Promise<ProviderOrder>;
  captureOrder(operation: ProviderOperation): Promise<ProviderOrder>;
  verifyWebhook(raw: Uint8Array, headers: Headers): Promise<VerifiedWebhook>;
}
export interface HttpContext {
  request: Request; db: DatabaseSync; config: Config; now: () => number; responseHeaders: Headers;
  provider?: PayPalGateway; fetchImpl?: typeof fetch;
}
