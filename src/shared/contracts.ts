export type Currency = "USD";
export type AttemptState = "reserved" | "creating" | "awaiting_buyer" | "capturing" | "pending" | "uncertain" | "paid" | "terminal_unpaid";
export interface ScopeQuestion { id: string; text: string; blocking: boolean; answer: string | null }
export interface QuoteItem { description: string; quantity: number; unitCents: number }
export interface ScopeExtraction {
  goal: string;
  deliverables: string[];
  timing: string | null;
  constraints: string[];
  assumptions: string[];
  questions: ScopeQuestion[];
}
export interface DraftInput extends ScopeExtraction { brief: string; items: QuoteItem[]; depositCents: number }
export interface ApprovedQuote extends ScopeExtraction {
  quoteId: string; revision: number; items: QuoteItem[];
  totalCents: number; depositCents: number; currency: Currency; approvedAt: number;
}
export interface PaymentDto {
  state: AttemptState; paid: boolean; retryAllowed: boolean; cancelObserved: boolean;
  depositCents: number; currency: Currency; verifiedAt: number | null;
}
export interface EngagementDto {
  engagementId: string; draftVersion: number; draft: DraftInput;
  quote: ApprovedQuote | null; payment: PaymentDto | null; createdAt: number;
}
export interface AuthResponse { authenticated: boolean; username: string | null; csrfToken: string }
export interface CheckoutLink { capabilityId: string; checkoutUrl: string; expiresAt: number }
export interface CheckoutDto { payment: PaymentDto; approvalUrl: string | null }
export interface BuyerDto { quote: ApprovedQuote; payment: PaymentDto }
export interface HealthDto { sandboxOnly: true; paypalConfigured: boolean; webhookConfigured: boolean; aiConfigured: boolean; aiUsageEnabled: boolean }
export type ErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "CONFLICT" | "PROVIDER_UNAVAILABLE" | "CONFIG_REQUIRED" | "RATE_LIMITED";
export interface ApiError { error: { code: ErrorCode; message: string } }
export const LIMITS = { briefChars: 12000, textChars: 2000, items: 100, quantity: 1000, unitCents: 100000000, totalCents: 100000000000 } as const;
