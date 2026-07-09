"use client";

import { useState } from "react";
import { depositLabels, formatMoney, statusLabels } from "@/lib/orders";
import type { Order } from "@/lib/types";
import { DepositPaymentActions } from "./DepositPaymentActions";

export function OrderAccess({ orderId }: { orderId: string }) {
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function unlock() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/orders/${orderId}/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identity, password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Order could not be opened.");
      setOrder(payload.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  if (!order) {
    return (
      <section className="card">
        <h2>Open your order</h2>
        <p className="muted">Enter the email or mobile number used for this order, plus the password set during submission.</p>
        {error ? <p className="error-state">{error}</p> : null}
        <div className="form-grid">
          <div className="field"><label>Email or Mobile Number</label><input value={identity} onChange={(event) => setIdentity(event.target.value)} /></div>
          <div className="field"><label>Order Password</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        </div>
        <div className="actions">
          <button className="button" disabled={busy} onClick={unlock} type="button">{busy ? "Checking..." : "Open Order"}</button>
        </div>
      </section>
    );
  }

  const preview = order.preview_config ?? {};
  const estimatedTotal = typeof preview.orderTotal === "number" ? preview.orderTotal : null;
  const unitPrice = typeof preview.unitPrice === "number" ? preview.unitPrice : null;

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">{order.reference_code}</p>
          <h1>Order summary</h1>
        </div>
        <div className="nav">
          <span className={`badge ${order.order_status}`}>{statusLabels[order.order_status]}</span>
          <span className={`badge ${order.deposit_status}`}>{depositLabels[order.deposit_status]}</span>
        </div>
      </div>

      <div className="grid">
        <section className="card">
          <h2>Customer</h2>
          <div className="meta-list">
            <p><span>Name</span>{order.customer_name}</p>
            <p><span>Email</span>{order.customer_email}</p>
            <p><span>Phone</span>{order.customer_phone ?? "Not provided"}</p>
          </div>
        </section>

        <section className="card">
          <h2>Design</h2>
          <div className="meta-list">
            <p><span>Service</span>{order.design_service.replaceAll("_", " ")}</p>
            <p><span>Notes</span>{order.design_notes ?? "No notes"}</p>
            <p><span>File</span>{order.design_file_url ? <a className="ghost-button" href={order.design_file_url}>Open uploaded design</a> : "No file uploaded"}</p>
          </div>
        </section>

        <section className="card">
          <h2>Payment</h2>
          <div className="meta-list">
            <p><span>Estimated total</span>{estimatedTotal ? formatMoney(estimatedTotal) : "Pending staff quote"}</p>
            <p><span>Unit price</span>{unitPrice ? formatMoney(unitPrice) : "Pending staff quote"}</p>
            <p><span>Deposit due</span>{formatMoney(order.deposit_amount)}</p>
          </div>
        </section>
      </div>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Items</h2>
        <table className="table">
          <thead><tr><th>Size</th><th>Quantity</th><th>Colour</th><th>Text</th></tr></thead>
          <tbody>{order.order_line_items?.map((item) => <tr key={item.id}><td>{item.size}</td><td>{item.quantity}</td><td>{item.colour}</td><td>{item.custom_text ?? ""}</td></tr>)}</tbody>
        </table>
      </section>

      <section style={{ marginTop: 18 }}>
        <DepositPaymentActions depositPaid={order.deposit_status === "paid"} orderId={order.id} />
      </section>
    </>
  );
}
