"use client";

import * as React from "react";
import type { DraftInput, EngagementDto, HealthDto, ScopeQuestion } from "../shared/contracts";
import { api, ApiFailure, formatMoney, parseMoney } from "./api";
import { Button } from "./primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./primitives/card";
import { Input } from "./primitives/input";
import { Label } from "./primitives/label";
import { Textarea } from "./primitives/textarea";

const SAMPLE_BRIEF = `A small architecture studio needs a six-page portfolio site. Include a project index, three case studies, an about page, and a contact page. The studio will provide copy and photography. Target launch date is not yet confirmed. The site must work well on mobile and include a simple way to update project entries.`;

const emptyDraft: DraftInput = {
  brief: "", goal: "", deliverables: [], timing: null, constraints: [], assumptions: [], questions: [], items: [], depositCents: 0,
};

function lines(value: string): string[] {
  return value.split("\n").map((part) => part.trim()).filter(Boolean);
}

function listText(value: string[]): string {
  return value.join("\n");
}

function statusLabel(payment: EngagementDto["payment"]): string {
  if (!payment) return "No checkout attempt";
  if (payment.paid) return "Deposit verified";
  if (payment.state === "terminal_unpaid") return "Confirmed unpaid";
  if (payment.cancelObserved) return "Cancellation observed · outcome unresolved";
  if (["uncertain", "pending", "creating", "capturing"].includes(payment.state)) return "Payment outcome unresolved";
  if (payment.state === "awaiting_buyer") return "Waiting for buyer";
  return "Checkout reserved";
}

function paymentTone(payment: EngagementDto["payment"]): string {
  if (payment?.paid) return "state state-good";
  if (payment?.state === "terminal_unpaid") return "state state-bad";
  if (payment) return "state state-pending";
  return "state state-neutral";
}

function moneyInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

function MoneyField({ id, cents, onCommit, disabled }: { id: string; cents: number; onCommit: (value: number) => void; disabled?: boolean }) {
  const [text, setText] = React.useState(() => moneyInput(cents));
  const committed = React.useRef(cents);
  React.useEffect(() => {
    if (cents !== committed.current) {
      committed.current = cents;
      setText(moneyInput(cents));
    }
  }, [cents]);
  return <Input id={id} disabled={disabled} inputMode="decimal" value={text} onChange={(event) => setText(event.target.value)} onBlur={() => {
    const parsed = parseMoney(text);
    if (parsed === null) { setText(moneyInput(cents)); return; }
    committed.current = parsed;
    setText(moneyInput(parsed));
    onCommit(parsed);
  }} />;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Request could not be completed.";
}

function asDraft(value: DraftInput): DraftInput {
  return structuredClone(value);
}

function questionId(): string {
  return globalThis.crypto.randomUUID();
}

export function OwnerWorkspace() {
  const [csrf, setCsrf] = React.useState("");
  const [authenticated, setAuthenticated] = React.useState(false);
  const [username, setUsername] = React.useState<string | null>(null);
  const [health, setHealth] = React.useState<HealthDto | null>(null);
  const [engagements, setEngagements] = React.useState<EngagementDto[]>([]);
  const [current, setCurrent] = React.useState<EngagementDto | null>(null);
  const [draft, setDraft] = React.useState<DraftInput>(asDraft(emptyDraft));
  const [links, setLinks] = React.useState<Record<string, { capabilityId: string; checkoutUrl: string; expiresAt: number }>>({});
  const [loginName, setLoginName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [failure, setFailure] = React.useState("");
  const selectionRequest = React.useRef(0);

  const updateLinks = React.useCallback((value: typeof links) => {
    setLinks(value);
    try { sessionStorage.setItem("scope-owner-checkout-links", JSON.stringify(value)); } catch { /* Session storage may be unavailable. */ }
  }, []);

  React.useEffect(() => {
    let active = true;
    Promise.all([api.session(), api.health()]).then(([session, status]) => {
      if (!active) return;
      setCsrf(session.csrfToken);
      setAuthenticated(session.authenticated);
      setUsername(session.username);
      setHealth(status);
      if (session.authenticated) {
        try {
          const saved = sessionStorage.getItem("scope-owner-checkout-links");
          if (saved) setLinks(JSON.parse(saved) as typeof links);
        } catch { /* A fresh link can still be created in this tab. */ }
        void api.list().then((result) => active && setEngagements(result.engagements)).catch((error) => active && setFailure(errorText(error)));
      } else {
        updateLinks({});
      }
    }).catch((error) => { if (active) setFailure(errorText(error)); });
    return () => { active = false; };
  }, [updateLinks]);

  const select = async (id: string) => {
    const requestId = ++selectionRequest.current;
    setFailure(""); setNotice(""); setBusy(true);
    try {
      const value = await api.get(id);
      if (requestId !== selectionRequest.current) return;
      setCurrent(value); setDraft(asDraft(value.draft));
    } catch (error) { if (requestId === selectionRequest.current) setFailure(errorText(error)); }
    finally { if (requestId === selectionRequest.current) setBusy(false); }
  };

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setFailure("");
    try {
      const result = await api.login(loginName, password, csrf);
      setCsrf(result.csrfToken); setAuthenticated(result.authenticated); setUsername(result.username); setPassword("");
      const listed = await api.list(); setEngagements(listed.engagements);
      setNotice("Signed in.");
    } catch (error) { setFailure(errorText(error)); }
    finally { setBusy(false); }
  };

  const logout = async () => {
    setBusy(true); setFailure("");
    try {
      const result = await api.logout(csrf);
      setCsrf(result.csrfToken); setAuthenticated(false); setUsername(null); setCurrent(null); setEngagements([]);
      updateLinks({});
      setNotice("Signed out. Owner access has ended for this session.");
    } catch (error) { setFailure(errorText(error)); }
    finally { setBusy(false); }
  };

  const createEngagement = async () => {
    setBusy(true); setFailure(""); setNotice("");
    try {
      const created = await api.create(csrf);
      setCurrent(created); setDraft(asDraft(created.draft));
      setEngagements((items) => [created, ...items]);
      setNotice("New engagement created. Add a brief, scope, and quote details.");
    } catch (error) { setFailure(errorText(error)); }
    finally { setBusy(false); }
  };

  const save = async (keepBusy = false) => {
    if (!current) return null;
    selectionRequest.current++;
    setBusy(true); setFailure(""); setNotice("");
    try {
      const saved = await api.save(current.engagementId, current.draftVersion, draft, csrf);
      setCurrent(saved); setDraft(asDraft(saved.draft));
      setEngagements((items) => items.map((item) => item.engagementId === saved.engagementId ? saved : item));
      setNotice("Draft saved.");
      return saved;
    } catch (error) { setFailure(errorText(error)); return null; }
    finally { if (!keepBusy) setBusy(false); }
  };

  const extract = async () => {
    setBusy(true); setFailure(""); setNotice("");
    try {
      const result = await api.extract(draft.brief, csrf);
      setDraft((value) => ({ ...value, ...result }));
      setNotice("AI returned draft facts and questions. Review and edit every field before approval.");
    } catch (error) { setFailure(errorText(error)); }
    finally { setBusy(false); }
  };

  const approve = async () => {
    const saved = await save(true);
    if (!saved) { setBusy(false); return; }
    setFailure(""); setNotice("");
    try {
      await api.approve(saved.engagementId, saved.draftVersion, csrf);
      const refreshed = await api.get(saved.engagementId);
      setCurrent(refreshed); setDraft(asDraft(refreshed.draft));
      setEngagements((items) => items.map((item) => item.engagementId === refreshed.engagementId ? refreshed : item));
      setNotice("Quote approved and frozen as a revision. Checkout can now be issued.");
    } catch (error) { setFailure(errorText(error)); }
    finally { setBusy(false); }
  };

  const issueLink = async () => {
    if (!current?.quote) return;
    setBusy(true); setFailure(""); setNotice("");
    try {
      const link = await api.checkout(current.engagementId, current.quote.quoteId, csrf);
      updateLinks({ ...links, [current.engagementId]: link });
      const refreshed = await api.get(current.engagementId); setCurrent(refreshed);
      setEngagements((items) => items.map((item) => item.engagementId === refreshed.engagementId ? refreshed : item));
      setNotice("Checkout link created. Share it only with the intended buyer.");
    } catch (error) { setFailure(errorText(error)); }
    finally { setBusy(false); }
  };

  const revokeLink = async () => {
    if (!current) return;
    const link = links[current.engagementId];
    if (!link) return;
    setBusy(true); setFailure(""); setNotice("");
    try {
      await api.revoke(link.capabilityId, csrf);
      const next = { ...links }; delete next[current.engagementId]; updateLinks(next);
      setNotice("Checkout capability revoked.");
    } catch (error) { setFailure(errorText(error)); }
    finally { setBusy(false); }
  };

  const reconcile = async () => {
    if (!current) return;
    setBusy(true); setFailure(""); setNotice("");
    try {
      const result = await api.reconcile(current.engagementId, csrf);
      setCurrent(result); setDraft(asDraft(result.draft));
      setEngagements((items) => items.map((item) => item.engagementId === result.engagementId ? result : item));
      setNotice(result.payment?.paid ? "Provider evidence verified. Deposit is paid." : "Reconciliation checked the existing attempt. No paid state was inferred from a redirect.");
    } catch (error) { setFailure(errorText(error)); }
    finally { setBusy(false); }
  };

  const setListField = (key: "deliverables" | "constraints" | "assumptions", value: string) =>
    setDraft((item) => ({ ...item, [key]: lines(value) }));
  const setQuestion = (id: string, changes: Partial<ScopeQuestion>) =>
    setDraft((item) => ({ ...item, questions: item.questions.map((question) => question.id === id ? { ...question, ...changes } : question) }));
  const dirty = current ? JSON.stringify(current.draft) !== JSON.stringify(draft) : false;
  const totalCents = draft.items.reduce((total, item) => total + item.quantity * item.unitCents, 0);
  const approvalIssues = [
    !draft.goal.trim() ? "Add a project goal." : "",
    draft.deliverables.length === 0 || draft.deliverables.some((item) => !item.trim()) ? "Add at least one complete deliverable." : "",
    draft.questions.some((question) => !question.text.trim()) ? "Complete or remove every question." : "",
    draft.questions.some((question) => question.blocking && !question.answer?.trim()) ? "Answer every blocking question." : "",
    draft.items.length === 0 ? "Add at least one line item." : "",
    draft.items.some((item) => !item.description.trim()) ? "Complete every line item description." : "",
    draft.items.some((item) => !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000) ? "Use a whole-number quantity from 1 to 1,000." : "",
    draft.items.some((item) => !Number.isSafeInteger(item.unitCents) || item.unitCents < 0 || item.unitCents > 100000000) ? "Unit amounts must be valid USD cents within the supported limit." : "",
    !Number.isSafeInteger(totalCents) || totalCents <= 0 || totalCents > 100000000000 ? "Quote total must be greater than $0 and within the supported limit." : "",
    !Number.isSafeInteger(draft.depositCents) || draft.depositCents <= 0 || draft.depositCents > totalCents ? "Deposit must be greater than $0 and no more than the quote total." : "",
  ].filter(Boolean);
  const canApprove = Boolean(current && !current.quote && approvalIssues.length === 0);
  const activeLink = current ? links[current.engagementId] : undefined;

  if (!authenticated) {
    return <main className="auth-shell">
      <div className="auth-aside">
        <div className="brand-mark" aria-hidden="true">SD</div>
        <p className="eyebrow">SCOPE TO DEPOSIT <span>LOCAL WORKSPACE</span></p>
        <h1>Agree on the work.<br /><span>Then take the deposit.</span></h1>
        <p className="auth-copy">Turn a clear brief into an editable scope, an approved quote, and a buyer checkout link.</p>
        <div className="auth-rule" />
        <p className="fine-print">Sandbox only. Payment status comes from verified server evidence.</p>
      </div>
      <section className="auth-panel" aria-labelledby="login-title">
        <p className="eyebrow">OWNER ACCESS</p>
        <h2 id="login-title">Sign in</h2>
        <p className="section-copy">Use the private credentials created for this local installation.</p>
        {failure && <p className="alert alert-error" role="alert">{failure}</p>}
        {notice && <p className="alert alert-info" role="status">{notice}</p>}
        <form className="form-stack" onSubmit={login}>
          <div className="field-group"><Label htmlFor="username">Username</Label><Input id="username" autoComplete="username" value={loginName} onChange={(event) => setLoginName(event.target.value)} required /></div>
          <div className="field-group"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
          <Button type="submit" disabled={busy || !csrf} className="w-full">{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
        <p className="fine-print">No account provisioning happens here.</p>
      </section>
    </main>;
  }

  return <main className="workspace-shell">
    <header className="topbar">
      <a className="wordmark" href="/" aria-label="Scope to Deposit home"><span className="brand-mark" aria-hidden="true">SD</span><span>Scope to Deposit</span></a>
      <div className="topbar-right"><span className="signed-in">{username}</span><Button variant="ghost" size="sm" type="button" onClick={() => void logout()} disabled={busy}>Sign out</Button></div>
    </header>

    <div className="workspace-grid">
      <aside className="engagement-rail" aria-label="Engagements">
        <div className="rail-heading"><div><p className="eyebrow">YOUR WORK</p><h2>Engagements</h2></div><Button type="button" size="sm" variant="outline" onClick={() => void createEngagement()} disabled={busy} aria-label="Create engagement">New</Button></div>
        {engagements.length === 0 ? <div className="empty-note"><strong>Start with a brief.</strong><p>Create your first engagement. A synthetic brief is available inside the editor.</p></div> :
          <ul className="engagement-list">{engagements.map((item) => <li key={item.engagementId}><button type="button" disabled={busy} data-engagement-id={item.engagementId} className={`engagement-item ${current?.engagementId === item.engagementId ? "selected" : ""}`} onClick={() => void select(item.engagementId)}><span className="engagement-item-title">{item.draft.goal || item.draft.brief.slice(0, 54) || "Untitled engagement"}</span><span className="engagement-item-state">{item.payment?.paid ? "Deposit verified" : item.quote ? "Quote approved" : "Draft"}</span></button></li>)}</ul>}
        <div className="rail-foot"><span className={`integration-dot ${health?.paypalConfigured ? "configured" : ""}`} aria-hidden="true" />PayPal sandbox {health?.paypalConfigured ? "configured" : "not configured"}</div>
      </aside>

      <section className="editor-column">
        <div className="page-heading"><div><p className="eyebrow">OWNER WORKSPACE</p><h1>{current ? (draft.goal || "Untitled engagement") : "Make the scope clear."}</h1><p className="section-copy">A human reviewed quote comes before every buyer payment.</p></div>
          {current && <div className="version-mark">{current.quote ? `REVISION ${current.quote.revision}` : `DRAFT · V${current.draftVersion}`}</div>}
        </div>

        {!current ? <Card className="welcome-panel"><CardContent className="welcome-content"><p className="eyebrow">A BETTER HANDOFF</p><h2>From a client brief<br />to an approved deposit.</h2><p>Keep scope and money editable until you approve a frozen quote. Then share a scoped checkout link with the buyer.</p><Button type="button" onClick={() => void createEngagement()} disabled={busy}>Create engagement</Button></CardContent></Card> : <>
          {failure && <p className="alert alert-error" role="alert">{failure}</p>}
          {notice && <p className="alert alert-info" role="status">{notice}</p>}

          <Card className="section-card">
            <CardHeader><div className="section-title-line"><div><p className="eyebrow">01 / SOURCE</p><CardTitle>Client brief</CardTitle></div><Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setDraft((value) => ({ ...value, brief: SAMPLE_BRIEF }))}>Use sample brief</Button></div><CardDescription>Use synthetic or client-approved text. The extractor returns draft facts and questions only.</CardDescription></CardHeader>
            <CardContent className="form-stack">
              <div className="field-group"><Label htmlFor="brief">Brief</Label><Textarea id="brief" disabled={busy} rows={6} maxLength={12000} value={draft.brief} onChange={(event) => setDraft((value) => ({ ...value, brief: event.target.value }))} placeholder="Describe the client's goal, deliverables, timing, and constraints." /><p className="field-hint">{draft.brief.length.toLocaleString()} / 12,000 characters</p></div>
              <div className="inline-actions"><Button type="button" variant="outline" onClick={() => void extract()} disabled={busy || !health?.aiConfigured || !health.aiUsageEnabled || !draft.brief.trim()}>{busy ? "Working…" : "Extract draft scope"}</Button><span className="field-hint">{health?.aiUsageEnabled && health.aiConfigured ? "AI output is editable and never approves terms." : "AI extraction disabled. Manual scope editing remains available."}</span></div>
            </CardContent>
          </Card>

          <Card className="section-card">
            <CardHeader><p className="eyebrow">02 / SCOPE</p><CardTitle>Review the work</CardTitle><CardDescription>Confirm details with the client. Blocking questions must have answers before approval.</CardDescription></CardHeader>
            <CardContent className="form-stack">
              <div className="field-group"><Label htmlFor="goal">Goal</Label><Input id="goal" disabled={busy} maxLength={2000} value={draft.goal} onChange={(event) => setDraft((value) => ({ ...value, goal: event.target.value }))} /></div>
              <div className="field-group"><Label htmlFor="deliverables">Deliverables <span className="label-detail">one per line</span></Label><Textarea id="deliverables" disabled={busy} value={listText(draft.deliverables)} onChange={(event) => setListField("deliverables", event.target.value)} placeholder="Project index\nThree case studies\nContact page" /></div>
              <div className="field-group"><Label htmlFor="timing">Timing</Label><Input id="timing" disabled={busy} maxLength={2000} value={draft.timing ?? ""} onChange={(event) => setDraft((value) => ({ ...value, timing: event.target.value || null }))} placeholder="Not specified" /></div>
              <div className="field-grid"><div className="field-group"><Label htmlFor="constraints">Constraints <span className="label-detail">one per line</span></Label><Textarea id="constraints" disabled={busy} value={listText(draft.constraints)} onChange={(event) => setListField("constraints", event.target.value)} /></div><div className="field-group"><Label htmlFor="assumptions">Assumptions <span className="label-detail">one per line</span></Label><Textarea id="assumptions" disabled={busy} value={listText(draft.assumptions)} onChange={(event) => setListField("assumptions", event.target.value)} /></div></div>
              <div className="question-heading"><div><Label>Questions to resolve</Label><p className="field-hint">AI questions are suggestions. Mark unresolved items as blocking.</p></div><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setDraft((value) => ({ ...value, questions: [...value.questions, { id: questionId(), text: "", blocking: true, answer: null }] }))}>Add question</Button></div>
              {draft.questions.length === 0 ? <p className="quiet-empty">No open questions.</p> : <div className="question-list">{draft.questions.map((question, index) => <div className="question-row" key={question.id}><div className="field-group"><Label htmlFor={`question-${question.id}`}>Question {index + 1}</Label><Input id={`question-${question.id}`} disabled={busy} value={question.text} onChange={(event) => setQuestion(question.id, { text: event.target.value })} /></div><div className="field-group"><Label htmlFor={`answer-${question.id}`}>Answer</Label><Input id={`answer-${question.id}`} disabled={busy} value={question.answer ?? ""} placeholder="Add confirmed answer" onChange={(event) => setQuestion(question.id, { answer: event.target.value || null })} /></div><label className="check-line"><input type="checkbox" disabled={busy} checked={question.blocking} onChange={(event) => setQuestion(question.id, { blocking: event.target.checked })} />Blocking</label><Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setDraft((value) => ({ ...value, questions: value.questions.filter((item) => item.id !== question.id) }))} aria-label={`Remove question ${index + 1}`}>Remove</Button></div>)}</div>}
            </CardContent>
          </Card>

          <Card className="section-card">
            <CardHeader><p className="eyebrow">03 / QUOTE</p><CardTitle>Commercial terms</CardTitle><CardDescription>USD only. Use integer quantities and per-unit amounts. No tax is calculated.</CardDescription></CardHeader>
            <CardContent className="form-stack">
              <div className="items-heading"><Label>Line items</Label><Button type="button" size="sm" variant="outline" disabled={busy || draft.items.length >= 100} onClick={() => setDraft((value) => ({ ...value, items: [...value.items, { description: "", quantity: 1, unitCents: 0 }] }))}>Add line item</Button></div>
              {draft.items.length === 0 ? <p className="quiet-empty">Add at least one item before approval.</p> : <div className="quote-lines">{draft.items.map((item, index) => <div className="quote-row" key={index}><div className="field-group quote-description"><Label htmlFor={`item-${index}`}>Description</Label><Input id={`item-${index}`} disabled={busy} maxLength={2000} value={item.description} onChange={(event) => setDraft((value) => ({ ...value, items: value.items.map((line, i) => i === index ? { ...line, description: event.target.value } : line) }))} /></div><div className="field-group quote-quantity"><Label htmlFor={`quantity-${index}`}>Qty</Label><Input id={`quantity-${index}`} disabled={busy} type="number" min={1} max={1000} step={1} value={item.quantity} onChange={(event) => setDraft((value) => ({ ...value, items: value.items.map((line, i) => i === index ? { ...line, quantity: Number(event.target.value) } : line) }))} /></div><div className="field-group quote-price"><Label htmlFor={`price-${index}`}>Unit price · USD</Label><MoneyField id={`price-${index}`} disabled={busy} cents={item.unitCents} onCommit={(cents) => setDraft((value) => ({ ...value, items: value.items.map((line, i) => i === index ? { ...line, unitCents: cents } : line) }))} /></div><div className="line-total"><span className="field-hint">Line total</span><strong>{formatMoney(item.quantity * item.unitCents)}</strong></div><Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setDraft((value) => ({ ...value, items: value.items.filter((_, i) => i !== index) }))} aria-label={`Remove line item ${index + 1}`}>Remove</Button></div>)}</div>}
              <div className="quote-summary"><div><span>Quote total</span><strong>{formatMoney(totalCents)}</strong></div><div className="deposit-entry"><Label htmlFor="deposit">Deposit · USD</Label><div className="deposit-input"><span aria-hidden="true">$</span><MoneyField id="deposit" disabled={busy} cents={draft.depositCents} onCommit={(cents) => setDraft((value) => ({ ...value, depositCents: cents }))} /><span>USD</span></div></div></div>
              {!current.quote && approvalIssues.length > 0 && <div className="field-errors" role="status" aria-live="polite"><p>Resolve before approval</p><ul>{approvalIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}
            </CardContent>
          </Card>

          <div className="editor-actions"><div><p className="eyebrow">{current.quote ? "APPROVED REVISION" : "HUMAN REVIEW"}</p><p className="field-hint">{current.quote ? "Commercial terms are frozen for this approved revision." : "Save edits, resolve blockers, then explicitly approve the quote."}</p></div><div className="action-buttons"><Button type="button" variant="outline" disabled={busy || !dirty} onClick={() => void save()}>{busy ? "Saving…" : "Save draft"}</Button>{!current.quote && <Button type="button" onClick={() => void approve()} disabled={busy || !canApprove}>{busy ? "Saving and approving…" : "Approve quote"}</Button>}</div></div>

          {current.quote && <Card className="section-card checkout-card"><CardHeader><div className="section-title-line"><div><p className="eyebrow">04 / PAYMENT</p><CardTitle>Buyer checkout</CardTitle></div><span className={paymentTone(current.payment)}>{statusLabel(current.payment)}</span></div><CardDescription>The approved revision is immutable. Checkout stays sandbox-only; redirects do not prove payment.</CardDescription></CardHeader><CardContent className="form-stack">
            <div className="approved-summary"><span>{current.quote.items.length} line item{current.quote.items.length === 1 ? "" : "s"}</span><strong>Deposit {formatMoney(current.quote.depositCents)} USD</strong><span>Total {formatMoney(current.quote.totalCents)} USD</span></div>
            {!health?.paypalConfigured && <p className="alert alert-warning">PayPal sandbox is not configured. Quote editing and approval remain available. Checkout creation and reconciliation require sandbox app credentials and merchant configuration.</p>}
            {current.payment?.paid && <p className="alert alert-success">Deposit verified by the server at {current.payment.verifiedAt ? new Date(current.payment.verifiedAt).toLocaleString() : "an unknown time"}. This status is backed by matched provider evidence.</p>}
            {current.payment && !current.payment.paid && <div className="payment-observation"><p><strong>{statusLabel(current.payment)}</strong></p><p>{current.payment.state === "terminal_unpaid" ? "The server has verified a terminal unpaid outcome." : "Pending, uncertain, or canceled browser states remain unresolved until the existing provider attempt is reconciled."}</p><Button type="button" variant="outline" size="sm" onClick={() => void reconcile()} disabled={busy || !health?.paypalConfigured}>Reconcile existing attempt</Button></div>}
            {activeLink ? <div className="checkout-link-box"><Label htmlFor="checkout-link">Buyer link</Label><div className="link-actions"><Input id="checkout-link" readOnly value={activeLink.checkoutUrl} onFocus={(event) => event.currentTarget.select()} /><Button type="button" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(activeLink.checkoutUrl); setNotice("Checkout link copied."); } catch { setFailure("Clipboard access unavailable. Select and copy the link manually."); } }}>Copy</Button><Button type="button" variant="danger" onClick={() => void revokeLink()} disabled={busy}>Revoke</Button></div><p className="field-hint">Expires {new Date(activeLink.expiresAt).toLocaleString()}. Revocation invalidates the buyer capability.</p></div> : !current.payment && <div className="checkout-create"><p className="section-copy">Issue one capability for this approved quote. The checkout link is scoped and expires.</p><Button type="button" onClick={() => void issueLink()} disabled={busy || !health?.paypalConfigured}>Create buyer checkout link</Button></div>}
          </CardContent></Card>}
        </>}
        <footer className="page-footer"><span>Scope to Deposit</span><span>Sandbox only · USD</span></footer>
      </section>
    </div>
  </main>;
}
