import Link from "next/link";
import { notFound } from "next/navigation";
import { depositLabels, formatMoney, getUrgency, statusLabels } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";
import { StaffOrderActions } from "../../StaffOrderActions";

export const dynamic = "force-dynamic";

async function getOrder(id: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, material_types(*), order_line_items(*), invoices(*), activities(*)")
    .eq("id", id)
    .order("created_at", { referencedTable: "activities", ascending: false })
    .single();
  return data as Order | null;
}

export default async function StaffOrderPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id);
  if (!order) notFound();
  const urgency = getUrgency(order);

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">i</span><span>inno413</span></Link>
        <nav className="nav"><Link className="ghost-button" href="/staff">Staff</Link><Link className="button" href="/orders/new">New Order</Link></nav>
      </header>
      <section className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">{order.reference_code}</p>
            <h1>{order.customer_name}</h1>
          </div>
          <div className="nav">
            <span className={`badge ${order.order_status}`}>{statusLabels[order.order_status]}</span>
            <span className={`badge ${urgency.label.toLowerCase()}`}>{urgency.label} urgency</span>
          </div>
        </div>

        <div className="grid">
          <section className="card">
            <h2>Brief</h2>
            <div className="meta-list">
              <p><span>Email</span>{order.customer_email}</p>
              <p><span>Phone</span>{order.customer_phone ?? "Not provided"}</p>
              <p><span>Design service</span>{order.design_service.replaceAll("_", " ")}</p>
              <p><span>Notes</span>{order.design_notes ?? "No notes"}</p>
              <p><span>Design file</span>{order.design_file_url ? <a className="ghost-button" href={order.design_file_url}>Open file</a> : "No file"}</p>
            </div>
          </section>

          <section className="card">
            <h2>Production</h2>
            <div className="meta-list">
              <p><span>Material</span>{order.material_types?.name ?? "Not selected"}</p>
              <p><span>Garment</span>{order.garment_type}</p>
              <p><span>Colour</span>{order.base_colour ?? "Not set"}</p>
              <p><span>Total quantity</span>{order.total_quantity}</p>
              <p><span>Needed by</span>{order.needed_by ?? "No deadline"}</p>
            </div>
          </section>

          <section className="card">
            <h2>Delivery & payment</h2>
            <div className="meta-list">
              <p><span>Delivery</span>{order.delivery_method} {order.delivery_address ? `- ${order.delivery_address}` : ""}</p>
              <p><span>Deposit</span>{depositLabels[order.deposit_status]} / {formatMoney(order.deposit_amount)}</p>
            </div>
          </section>
        </div>

        <section className="card" style={{ marginTop: 18 }}>
          <h2>Size breakdown</h2>
          <table className="table">
            <thead><tr><th>Size</th><th>Quantity</th><th>Colour</th><th>Text</th></tr></thead>
            <tbody>{order.order_line_items?.map((item) => <tr key={item.id}><td>{item.size}</td><td>{item.quantity}</td><td>{item.colour}</td><td>{item.custom_text ?? ""}</td></tr>)}</tbody>
          </table>
        </section>

        <section style={{ marginTop: 18 }}>
          <StaffOrderActions order={order} />
        </section>

        <section className="card" style={{ marginTop: 18 }}>
          <h2>Invoices</h2>
          {order.invoices?.length ? (
            <table className="table">
              <thead><tr><th>Invoice</th><th>Total</th><th>Deposit</th><th>Balance</th><th>Status</th></tr></thead>
              <tbody>{order.invoices.map((invoice) => <tr key={invoice.id}><td>{invoice.invoice_number}</td><td>{formatMoney(invoice.subtotal)}</td><td>{formatMoney(invoice.deposit_paid)}</td><td>{formatMoney(invoice.balance_due)}</td><td><span className={`badge ${invoice.payment_status}`}>{invoice.payment_status}</span></td></tr>)}</tbody>
            </table>
          ) : <p className="muted">No invoices yet.</p>}
        </section>

        <section className="card" style={{ marginTop: 18 }}>
          <h2>Activity log</h2>
          {order.activities?.length ? (
            <table className="table">
              <thead><tr><th>Action</th><th>Actor</th><th>When</th></tr></thead>
              <tbody>{order.activities.map((activity) => <tr key={activity.id}><td>{activity.action}</td><td>{activity.actor}</td><td>{new Date(activity.created_at).toLocaleString()}</td></tr>)}</tbody>
            </table>
          ) : <p className="muted">No activity yet.</p>}
        </section>
      </section>
    </main>
  );
}
