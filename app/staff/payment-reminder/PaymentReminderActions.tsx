"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/orders";
import type { Order } from "@/lib/types";

export function PaymentReminderActions({ order }: { order: Order }) {
  const [depositLink, setDepositLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const customerOrderUrl = typeof window === "undefined" ? "" : `${window.location.origin}/orders/${order.id}`;
  const cleanPhone = (order.customer_phone ?? "").replace(/[^\d]/g, "");
  const reminderText = useMemo(() => {
    const link = depositLink || customerOrderUrl;
    return `Hi ${order.customer_name}, reminder from inno413: please pay the ${formatMoney(order.deposit_amount)} deposit for order ${order.reference_code} within the next 24 hours here: ${link}. If payment is not received within 24 hours, your order may be removed from our system.`;
  }, [customerOrderUrl, depositLink, order.customer_name, order.deposit_amount, order.reference_code]);
  const whatsappLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reminderText)}`
    : `https://wa.me/?text=${encodeURIComponent(reminderText)}`;
  const emailLink = `mailto:${order.customer_email}?subject=${encodeURIComponent(`Payment reminder for ${order.reference_code}`)}&body=${encodeURIComponent(reminderText)}`;

  async function createDepositLink() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/stripe/deposit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Deposit link failed.");
      setDepositLink(payload.url);
      setMessage("Deposit link ready. Choose WhatsApp or email below.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Deposit link failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>Send payment reminder</h2>
      <p className="muted">Create a Stripe deposit link and send a 24-hour payment reminder.</p>
      <button className="button" disabled={busy || order.deposit_status === "paid"} onClick={createDepositLink} type="button">
        {busy ? "Creating link..." : "Create Deposit Link"}
      </button>
      {depositLink ? <input readOnly value={depositLink} onFocus={(event) => event.currentTarget.select()} /> : null}
      <textarea readOnly value={reminderText} />
      <div className="actions">
        <a className="ghost-button" href={whatsappLink} rel="noreferrer" target="_blank">Send via WhatsApp</a>
        <a className="ghost-button" href={emailLink}>Send via Email</a>
        <a className="ghost-button" href={customerOrderUrl} rel="noreferrer" target="_blank">Customer Payment Page</a>
      </div>
      {message ? <p className="empty-state">{message}</p> : null}
    </div>
  );
}
