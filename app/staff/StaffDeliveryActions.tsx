"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/types";

export function StaffDeliveryActions({ compact = false, order }: { compact?: boolean; order: Order }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [message, setMessage] = useState("");

  const cleanPhone = (order.customer_phone ?? "").replace(/[^\d]/g, "");
  const whatsappLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
  const emailLink = `mailto:${order.customer_email}?subject=${encodeURIComponent(`Balance payment for ${order.reference_code}`)}&body=${encodeURIComponent(message)}`;

  async function deliverAndRequestBalance() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/orders/${order.id}/deliver`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Action failed.");
      setPaymentUrl(payload.paymentUrl ?? "");
      setMessage(payload.message ?? "");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? "inline-actions" : "card"}>
      {!compact ? (
        <>
          <h2>Delivered & balance</h2>
          <p className="muted">Mark this order delivered and create a balance payment request with 20 working days payment duration.</p>
        </>
      ) : null}
      <button className="button" disabled={busy || order.order_status === "delivered"} onClick={deliverAndRequestBalance} type="button">
        {busy ? "Preparing..." : "Delivered"}
      </button>
      {error ? <p className="error-state">{error}</p> : null}
      {paymentUrl ? (
        <div className={compact ? "inline-actions" : "actions"}>
          <a className="ghost-button" href={whatsappLink} rel="noreferrer" target="_blank">WhatsApp Balance Link</a>
          <a className="ghost-button" href={emailLink}>Email Balance Link</a>
          {!compact ? <input readOnly value={paymentUrl} onFocus={(event) => event.currentTarget.select()} /> : null}
        </div>
      ) : null}
    </div>
  );
}
