"use client";

import { useState } from "react";

export function DepositPaymentActions({
  depositPaid,
  orderId,
}: {
  depositPaid: boolean;
  orderId: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function payDeposit() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/deposit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not open payment.");
      window.location.href = payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open payment.");
    } finally {
      setBusy(false);
    }
  }

  if (depositPaid) {
    return <p className="empty-state">Deposit paid. The inno413 team can begin processing this order.</p>;
  }

  return (
    <div className="card">
      <h2>Deposit payment</h2>
      <p className="muted">Your order is saved. Pay the deposit here so staff can begin work.</p>
      {error ? <p className="error-state">{error}</p> : null}
      <button className="button" disabled={busy} onClick={payDeposit} type="button">
        {busy ? "Opening Stripe..." : "Pay Deposit"}
      </button>
    </div>
  );
}
