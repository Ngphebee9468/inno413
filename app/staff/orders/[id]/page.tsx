import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { depositLabels, formatMoney, getUrgency, statusLabels } from "@/lib/orders";
import { hasStaffAccess } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/lib/types";
import { StaffDeliveryActions } from "../../StaffDeliveryActions";
import { StaffOrderActions } from "../../StaffOrderActions";

export const dynamic = "force-dynamic";

async function getOrder(id: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, material_types(*), order_line_items(*), invoices(*), activities(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("[staff:order]", error);
  return data as Order | null;
}

export default async function StaffOrderPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await hasStaffAccess())) redirect("/staff/login");
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const urgency = getUrgency(order);
  const preview = order.preview_config ?? {};
  const logoUrl = typeof preview.logoUrl === "string" ? preview.logoUrl : "";
  const otherDesignUrl = typeof preview.otherDesignUrl === "string" ? preview.otherDesignUrl : "";
  const customerOrderUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/orders/${order.id}`;
  const cleanPhone = (order.customer_phone ?? "").replace(/[^\d]/g, "");
  const designMessage = `Hi ${order.customer_name}, this is inno413 about order ${order.reference_code}. We would like to discuss and fine tune your t-shirt design.`;
  const designWhatsappLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(designMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(designMessage)}`;

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
              <p><span>Logo design</span>{logoUrl ? <a className="ghost-button" href={logoUrl}>Open logo</a> : "No logo uploaded"}</p>
              <p><span>Other design</span>{otherDesignUrl ? <a className="ghost-button" href={otherDesignUrl}>Open other design</a> : "No other design uploaded"}</p>
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
              <p><span>Customer view</span><a className="ghost-button" href={customerOrderUrl || `/orders/${order.id}`}>Open customer order page</a></p>
            </div>
          </section>
        </div>

        <div className="grid" style={{ marginTop: 18 }}>
          <section className="card">
            <h2>Design contact</h2>
            <p className="muted">Use WhatsApp to discuss and fine tune the customer design.</p>
            <div className="actions">
              <a className="button" href={designWhatsappLink} rel="noreferrer" target="_blank">WhatsApp Customer</a>
            </div>
          </section>
          <StaffDeliveryActions order={order} />
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
