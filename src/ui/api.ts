import type {
  ApiError,
  AuthResponse,
  BuyerDto,
  CheckoutDto,
  CheckoutLink,
  DraftInput,
  EngagementDto,
  HealthDto,
  ScopeExtraction,
} from "../shared/contracts";

export class ApiFailure extends Error {
  constructor(readonly code: string, message: string, readonly status: number) {
    super(message);
    this.name = "ApiFailure";
  }
}

export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; csrf?: string; checkoutToken?: string } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers = new Headers({ Accept: "application/json" });
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (method !== "GET" && options.csrf) headers.set("X-CSRF-Token", options.csrf);
  if (options.checkoutToken) headers.set("X-Checkout-Token", options.checkoutToken);
  const response = await fetch(path, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: "same-origin",
    cache: "no-store",
  });
  const value: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = value as ApiError | null;
    throw new ApiFailure(
      failure?.error?.code ?? "REQUEST_FAILED",
      failure?.error?.message ?? "Request could not be completed.",
      response.status,
    );
  }
  return value as T;
}

export const api = {
  session: () => request<AuthResponse>("/api/session"),
  health: () => request<HealthDto>("/api/health"),
  login: (username: string, password: string, csrf: string) =>
    request<AuthResponse>("/api/session", { method: "POST", body: { username, password }, csrf }),
  logout: (csrf: string) => request<AuthResponse>("/api/session", { method: "DELETE", body: {}, csrf }),
  list: () => request<{ engagements: EngagementDto[] }>("/api/engagements"),
  get: (id: string) => request<EngagementDto>(`/api/engagements/${id}`),
  create: (csrf: string) => request<EngagementDto>("/api/engagements", { method: "POST", body: {}, csrf }),
  save: (id: string, expectedVersion: number, draft: DraftInput, csrf: string) =>
    request<EngagementDto>(`/api/engagements/${id}/draft`, { method: "PUT", body: { expectedVersion, draft }, csrf }),
  approve: (id: string, expectedVersion: number, csrf: string) =>
    request(`/api/engagements/${id}/approve`, { method: "POST", body: { expectedVersion }, csrf }),
  extract: (brief: string, csrf: string) =>
    request<ScopeExtraction>("/api/extract", { method: "POST", body: { brief }, csrf }),
  checkout: (id: string, quoteId: string, csrf: string) =>
    request<CheckoutLink>(`/api/engagements/${id}/checkout`, { method: "POST", body: { quoteId }, csrf }),
  revoke: (capabilityId: string, csrf: string) =>
    request(`/api/capabilities/${capabilityId}`, { method: "DELETE", body: {}, csrf }),
  reconcile: (id: string, csrf: string) =>
    request<EngagementDto>(`/api/engagements/${id}/reconcile`, { method: "POST", body: {}, csrf }),
  buyer: (token: string) => request<BuyerDto>("/api/buyer", { checkoutToken: token }),
  buyerOrder: (token: string, csrf: string) =>
    request<CheckoutDto>("/api/buyer/order", { method: "POST", body: {}, csrf, checkoutToken: token }),
  buyerCapture: (token: string, csrf: string) =>
    request<BuyerDto["payment"]>("/api/buyer/capture", { method: "POST", body: {}, csrf, checkoutToken: token }),
  buyerCancel: (token: string, csrf: string) =>
    request<BuyerDto["payment"]>("/api/buyer/cancel", { method: "POST", body: {}, csrf, checkoutToken: token }),
};

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function parseMoney(value: string): number | null {
  const match = /^(0|[1-9]\d{0,8})(?:\.(\d{0,2}))?$/.exec(value.trim());
  if (!match) return null;
  const dollars = BigInt(match[1]);
  const cents = BigInt((match[2] ?? "").padEnd(2, "0"));
  const amount = dollars * 100n + cents;
  return amount <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(amount) : null;
}
