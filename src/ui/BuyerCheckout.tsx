"use client";

import * as React from "react";
import type { BuyerDto, HealthDto, PaymentDto } from "../shared/contracts";
import { api, formatMoney } from "./api";
import { Button } from "./primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./primitives/card";

const TOKEN_KEY = "scope-checkout-capability";

function paymentLabel(payment: PaymentDto): string {
  if (payment.paid) return "Deposit verified";
  if (payment.state === "terminal_unpaid") return "Confirmed unpaid";
  if (payment.cancelObserved) return "Cancellation observed · outcome unresolved";
  if (["uncertain", "pending", "creating", "capturing"].includes(payment.state)) return "Payment outcome unresolved";
  if (payment.state === "awaiting_buyer") return "Waiting for buyer";
  return "Checkout ready";
}

function stateClass(payment: PaymentDto): string {
  if (payment.paid) return "state state-good";
  if (payment.state === "terminal_unpaid") return "state state-bad";
  if (payment.cancelObserved || ["uncertain", "pending", "creating", "capturing"].includes(payment.state)) return "state state-pending";
  return "state state-neutral";
}

export function BuyerCheckout() {
  const [token, setToken] = React.useState("");
  const [csrf, setCsrf] = React.useState("");
  const [health, setHealth] = React.useState<HealthDto | null>(null);
  const [data, setData] = React.useState<BuyerDto | null>(null);
  const [resolved, setResolved] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");

  const load = React.useCallback(async (capability: string) => {
    const result = await api.buyer(capability);
    setData(result);
    return result;
  }, []);

  React.useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const approved = params.get("approved") === "1";
    const canceled = params.get("canceled") === "1";
    const fragmentToken = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    let capability = "";
    try {
      capability = fragmentToken || sessionStorage.getItem(TOKEN_KEY) || "";
      if (fragmentToken) sessionStorage.setItem(TOKEN_KEY, fragmentToken);
    } catch { capability = fragmentToken; }
    // The capability leaves the URL before any network request or external navigation.
    window.history.replaceState(null, "", "/pay");
    if (capability) setToken(capability);
    Promise.all([api.session(), api.health(), capability ? api.buyer(capability) : Promise.resolve(null)])
      .then(async ([session, status, buyer]) => {
        if (!active) return;
        setCsrf(session.csrfToken);
        setHealth(status);
        if (!capability || !buyer) { setResolved(true); return; }
        setData(buyer);
        if (approved && !buyer.payment.paid) {
          const payment = await api.buyerCapture(capability, session.csrfToken);
          if (!active) return;
          setData((value) => value ? { ...value, payment } : value);
          setNotice(payment.paid ? "Payment verified by the server." : "Approval return received. The existing payment attempt is being checked; no paid state was inferred from the redirect.");
        } else if (canceled && !buyer.payment.paid) {
          const payment = await api.buyerCancel(capability, session.csrfToken);
          if (!active) return;
          setData((value) => value ? { ...value, payment } : value);
          setNotice("Cancellation was observed. It does not confirm payment failure; the provider attempt remains subject to reconciliation.");
        }
        setResolved(true);
      })
      .catch((cause: unknown) => { if (active) { setError(cause instanceof Error ? cause.message : "Checkout could not be loaded."); setResolved(true); } });
    return () => { active = false; };
  }, []);

  const startPayment = async () => {
    if (!token) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await api.buyerOrder(token, csrf);
      setData((value) => value ? { ...value, payment: result.payment } : value);
      if (result.approvalUrl) {
        const destination = new URL(result.approvalUrl);
        if (destination.protocol !== "https:" || destination.hostname !== "www.sandbox.paypal.com") throw new Error("Provider returned an unexpected approval destination.");
        window.location.assign(destination.href);
      } else {
        setNotice("The payment attempt is pending or uncertain. It will not be replaced; the owner can reconcile the existing attempt.");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Payment could not be started."); }
    finally { setBusy(false); }
  };

  const observeCancellation = async () => {
    if (!token || !csrf) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const payment = await api.buyerCancel(token, csrf);
      setData((value) => value ? { ...value, payment } : value);
      setNotice("Cancellation observed. This is not payment-failure evidence.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Cancellation could not be recorded."); }
    finally { setBusy(false); }
  };

  const refresh = async () => {
    if (!token) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await load(token); setData(result);
      setNotice(result.payment.paid ? "Verified payment status refreshed." : "Status refreshed from the server. Pending and uncertain attempts remain unresolved.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Status could not be refreshed."); }
    finally { setBusy(false); }
  };

  return <main className="buyer-shell">
    <header className="buyer-topbar"><a className="wordmark" href="/" aria-label="Scope to Deposit"><span className="brand-mark" aria-hidden="true">SD</span><span>Scope to Deposit</span></a><span className="eyebrow">BUYER CHECKOUT · SANDBOX</span></header>
    <section className="buyer-content">
      {!token || (resolved && !data) ? <Card><CardContent className="access-message"><p className="eyebrow">PRIVATE CHECKOUT</p><h1>Checkout link unavailable</h1><p>{error || "This tab has no checkout capability. Open the buyer link shared by the freelancer. Access tokens are not accepted in page text or query parameters."}</p></CardContent></Card> : !data ? <Card><CardContent className="access-message"><p className="eyebrow">PRIVATE CHECKOUT</p><h1>Loading approved quote</h1>{error && <p className="alert alert-error" role="alert">{error}</p>}</CardContent></Card> : <>
        <div className="buyer-heading"><p className="eyebrow">QUOTE REVISION {data.quote.revision}</p><h1>Review the scope.</h1><p>Confirm the agreed work and deposit amount before continuing.</p></div>
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        {notice && <p className="alert alert-info" role="status">{notice}</p>}
        <Card className="buyer-quote">
          <CardHeader><div className="section-title-line"><div><p className="eyebrow">APPROVED SCOPE</p><CardTitle>{data.quote.goal || "Project scope"}</CardTitle></div><span className={stateClass(data.payment)}>{paymentLabel(data.payment)}</span></div><CardDescription>USD · Approved {new Date(data.quote.approvedAt).toLocaleDateString()}</CardDescription></CardHeader>
          <CardContent className="buyer-quote-content">
            <div className="buyer-scope-block"><h2>Deliverables</h2><ul>{data.quote.deliverables.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></div>
            <div className="buyer-details"><div><span>Timing</span><p>{data.quote.timing || "Not specified"}</p></div><div><span>Constraints</span><p>{data.quote.constraints.length ? data.quote.constraints.join(" · ") : "None listed"}</p></div><div><span>Assumptions</span><p>{data.quote.assumptions.length ? data.quote.assumptions.join(" · ") : "None listed"}</p></div></div>
            <div className="buyer-lines"><div className="buyer-line header"><span>Work</span><span>Quantity</span><span>Amount</span></div>{data.quote.items.map((item, index) => <div className="buyer-line" key={`${index}-${item.description}`}><span>{item.description}</span><span>{item.quantity}</span><span>{formatMoney(item.quantity * item.unitCents)}</span></div>)}</div>
            <div className="buyer-total"><div><span>Quote total</span><strong>{formatMoney(data.quote.totalCents)} USD</strong></div><div><span>Deposit due</span><strong>{formatMoney(data.quote.depositCents)} USD</strong></div></div>
          </CardContent>
        </Card>
        <Card className="buyer-action-card"><CardContent className="buyer-action-content">
          {!health?.paypalConfigured && !data.payment.paid && data.payment.state !== "terminal_unpaid" && <p className="alert alert-warning">PayPal sandbox is not configured. Checkout cannot start until sandbox app credentials and merchant configuration are available.</p>}
          {data.payment.paid ? <><p className="eyebrow">PAYMENT VERIFIED</p><h2>Deposit received.</h2><p>Server-verified capture evidence matches this quote. Verified {data.payment.verifiedAt ? new Date(data.payment.verifiedAt).toLocaleString() : "by the provider"}.</p></> : data.payment.state === "terminal_unpaid" ? <><p className="eyebrow">PAYMENT STATUS</p><h2>No deposit captured.</h2><p>The provider returned a verified terminal unpaid outcome for this attempt.</p></> : <><p className="eyebrow">SECURE SANDBOX PAYMENT</p><h2>Deposit {formatMoney(data.quote.depositCents)} USD</h2><p>PayPal handles buyer approval. Scope to Deposit captures only after provider approval and verifies the resulting capture against the approved amount and merchant.</p><Button type="button" onClick={() => void startPayment()} disabled={busy || !csrf || !health?.paypalConfigured || data.payment.cancelObserved || ["uncertain", "pending", "creating", "capturing"].includes(data.payment.state)}>{busy ? "Connecting…" : "Continue to PayPal sandbox"}</Button><p className="field-hint">A redirect alone never marks a deposit as paid.</p></>}
          {data.payment && !data.payment.paid && data.payment.state !== "terminal_unpaid" && <div className="buyer-secondary-actions"><Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={busy}>Refresh status</Button><Button type="button" variant="ghost" size="sm" onClick={() => void observeCancellation()} disabled={busy || data.payment.cancelObserved}>Record cancellation observation</Button></div>}
        </CardContent></Card>
        <p className="buyer-footnote">This is a sandbox checkout for an approved quote. A cancellation observation or payment redirect is not proof of the final payment outcome.</p>
      </>}
    </section>
  </main>;
}
