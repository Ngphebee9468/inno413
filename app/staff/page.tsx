import Link from "next/link";
import { depositLabels, formatMoney, getUrgency, statusLabels } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getOrders() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { orders: [] as Order[], error: "Supabase environment variables are missing." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, material_types(*), invoices(*)")
    .order("created_at", { ascending: false });
  if (error) return { orders: [] as Order[], error: error.message };

  const orders = ((data ?? []) as Order[]).sort((a, b) => {
    const urgency = getUrgency(b).score - getUrgency(a).score;
    if (urgency !== 0) return urgency;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  return { orders, error: null };
}

export default async function StaffPage() {
  const { orders, error } = await getOrders();

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">i</span><span>inno413</span></Link>
        <nav className="nav"><Link className="ghost-button" href="/">Orders</Link><Link className="button" href="/orders/new">New Order</Link></nav>
      </header>
      <section className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Staff dashboard</p>
            <h1>Production queue</h1>
          </div>
          <p className="muted">Sorted by urgency first, then oldest request.</p>
        </div>

        {error ? <div className="error-state">{error}</div> : null}
        {!error && orders.length === 0 ? <div className="empty-state">No orders found</div> : null}

        {orders.length > 0 ? (
          <div className="card">
            <table className="table">
              <thead>
                <tr><th>Reference</th><th>Customer</th><th>Urgency</th><th>Status</th><th>Invoice</th><th>Deposit</th><th>Total</th></tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const urgency = getUrgency(order);
                  const invoice = order.invoices?.[0];
                  return (
                    <tr key={order.id}>
                      <td><Link href={`/staff/orders/${order.id}`}><strong>{order.reference_code}</strong></Link></td>
                      <td>{order.customer_name}<br /><span className="muted">{order.material_types?.name ?? "No material"}</span></td>
                      <td><span className={`badge ${urgency.label.toLowerCase()}`}>{urgency.label}</span></td>
                      <td><span className={`badge ${order.order_status}`}>{statusLabels[order.order_status]}</span></td>
                      <td>
                        <Link className={`badge ${invoice?.payment_status ?? "outstanding"}`} href={`/staff/payment-reminder?order=${order.id}`}>
                          {invoice?.payment_status ?? "deposit reminder"}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/staff/payment-reminder?order=${order.id}`}>
                          {depositLabels[order.deposit_status]}
                        </Link>
                      </td>
                      <td>{formatMoney(invoice?.subtotal ?? order.deposit_amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}
