"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { allowedTransitions, formatMoney, statusLabels } from "@/lib/orders";
import type { Invoice, Order, OrderStatus } from "@/lib/types";

export function StaffOrderActions({ order }: { order: Order }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.order_status);
  const [notes, setNotes] = useState(order.staff_notes ?? "");
  const [subtotal, setSubtotal] = useState("880");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [message, setMessage] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [depositLink, setDepositLink] = useState("");
  const nextStatuses = useMemo(() => allowedTransitions[order.order_status] ?? [], [order.order_status]);
  const deposit = Number(order.deposit_amount ?? 0);
  const balance = Math.max(0, Number(subtotal || 0) - deposit);
  const customerOrderUrl =
    typeof window === "undefined" ? "" : `${window.location.origin}/orders/${order.id}`;
  const cleanPhone = (order.customer_phone ?? "").replace(/[^\d]/g, "");
  const depositReminderText = `Hi ${order.customer_name}, your inno413 order ${order.reference_code} is saved. Please pay the deposit here so we can begin work: ${depositLink || customerOrderUrl}`;
  const whatsappLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(depositReminderText)}`
    : `https://wa.me/?text=${encodeURIComponent(depositReminderText)}`;
  const emailLink = `mailto:${order.customer_email}?subject=${encodeURIComponent(`Deposit payment for ${order.reference_code}`)}&body=${encodeURIComponent(depositReminderText)}`;

  async function mutate(url: string, body?: unknown, method = "PATCH") {
    setMessage("");
    const response = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Action failed.");
    setMessage("Saved.");
    router.refresh();
    return payload;
  }

  async function updateStatus() {
    try {
      await mutate(`/api/orders/${order.id}/status`, { status });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Status failed.");
    }
  }

  async function saveNotes() {
    try {
      await mutate(`/api/orders/${order.id}/notes`, { staff_notes: notes });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Notes failed.");
    }
  }

  async function markDepositPaid() {
    try {
      await mutate(`/api/orders/${order.id}/deposit`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Deposit failed.");
    }
  }

  async function createDepositLink() {
    try {
      setMessage("");
      const response = await fetch("/api/stripe/deposit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Deposit link failed.");
      setDepositLink(payload.url);
      setMessage("Deposit link ready.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Deposit link failed.");
    }
  }

  async function createInvoice() {
    try {
      const invoice = (await mutate(
        `/api/orders/${order.id}/invoices`,
        { subtotal: Number(subtotal), deposit_paid: deposit, notes: invoiceNotes },
        "POST",
      )) as Invoice;
      const response = await fetch("/api/stripe/invoice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Payment link failed.");
      setPaymentLink(payload.url);
      setMessage("Invoice created.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Invoice failed.");
    }
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>Status</h2>
        <div className="field">
          <label>Next status</label>
          <select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus)}>
            <option value={order.order_status}>{statusLabels[order.order_status]}</option>
            {nextStatuses.map((next) => <option key={next} value={next}>{statusLabels[next]}</option>)}
          </select>
        </div>
        <button className="button" disabled={status === order.order_status} onClick={updateStatus} type="button">Save Status</button>
        {order.deposit_status !== "paid" ? (
          <button className="ghost-button" onClick={markDepositPaid} type="button">Mark Deposit Received</button>
        ) : null}
      </section>

      <section className="card">
        <h2>Chase deposit</h2>
        <p className="muted">Create a fresh Stripe deposit link, then send it by WhatsApp or email before starting production.</p>
        <button className="button" disabled={order.deposit_status === "paid"} onClick={createDepositLink} type="button">Create Deposit Link</button>
        {depositLink ? (
          <>
            <input readOnly value={depositLink} onFocus={(event) => event.currentTarget.select()} />
            <div className="actions">
              <a className="ghost-button" href={whatsappLink} rel="noreferrer" target="_blank">Send WhatsApp</a>
              <a className="ghost-button" href={emailLink}>Send Email</a>
            </div>
          </>
        ) : (
          <div className="actions">
            <a className="ghost-button" href={customerOrderUrl}>Open Customer Summary</a>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Staff notes</h2>
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        <button className="button" onClick={saveNotes} type="button">Save Notes</button>
      </section>

      <section className="card">
        <h2>Create invoice</h2>
        <div className="form-grid">
          <div className="field"><label>Total</label><input min="0" type="number" value={subtotal} onChange={(event) => setSubtotal(event.target.value)} /></div>
          <div className="field"><label>Deposit</label><input readOnly value={formatMoney(deposit)} /></div>
          <div className="field full"><label>Notes</label><textarea value={invoiceNotes} onChange={(event) => setInvoiceNotes(event.target.value)} /></div>
        </div>
        <p className="muted">Balance due: {formatMoney(balance)}</p>
        <button className="button" onClick={createInvoice} type="button">Create Invoice & Payment Link</button>
        {paymentLink ? <input readOnly value={paymentLink} onFocus={(event) => event.currentTarget.select()} /> : null}
      </section>

      {message ? <p className="empty-state">{message}</p> : null}
    </div>
  );
}
