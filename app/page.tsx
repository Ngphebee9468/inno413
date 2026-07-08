import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";
import { depositLabels, getUrgency, statusLabels } from "@/lib/orders";

export const dynamic = "force-dynamic";

async function getOrders() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { orders: [] as Order[], error: "Supabase environment variables are missing." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, material_types(*), order_line_items(*), invoices(*)")
    .order("created_at", { ascending: false });

  if (error) return { orders: [] as Order[], error: error.message };
  return { orders: (data ?? []) as Order[], error: null };
}

export default async function Home() {
  const { orders, error } = await getOrders();

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">i</span>
          <span>inno413</span>
        </Link>
        <nav className="nav">
          <Link className="ghost-button" href="/staff">Staff</Link>
          <Link className="button" href="/orders/new">New Order</Link>
        </nav>
      </header>

      <section className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Order board</p>
            <h1>Custom apparel orders</h1>
          </div>
          <p className="muted">Live order data from Supabase, visible without a login for demo-first v1.</p>
        </div>

        {error ? (
          <div className="error-state">
            <h2>Orders could not load</h2>
            <p className="muted">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <h2>No orders yet</h2>
            <p className="muted">Create the first custom apparel order to start the workflow.</p>
          </div>
        ) : (
          <div className="grid">
            {orders.map((order) => {
              const urgency = getUrgency(order);
              return (
                <Link className="card" href={`/staff/orders/${order.id}`} key={order.id}>
                  <div className="card-row">
                    <strong>{order.reference_code}</strong>
                    <span className={`badge ${order.order_status}`}>{statusLabels[order.order_status]}</span>
                  </div>
                  <div>
                    <h3>{order.customer_name}</h3>
                    <p className="muted">{order.design_notes || "No design notes yet"}</p>
                  </div>
                  <div className="meta-list">
                    <p><span>Material</span>{order.material_types?.name ?? "Not selected"} / {order.base_colour ?? "No colour"}</p>
                    <p><span>Quantity</span>{order.total_quantity} pieces</p>
                    <p><span>Deposit</span>{depositLabels[order.deposit_status]}</p>
                  </div>
                  <div className="card-row">
                    <span className={`badge ${urgency.label.toLowerCase()}`}>{urgency.label} urgency</span>
                    <span className="muted">{order.needed_by ?? "No deadline"}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
