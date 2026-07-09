import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";
import { depositLabels, getUrgency, statusLabels } from "@/lib/orders";
import { maskEmail, maskName } from "@/lib/privacy";

export const dynamic = "force-dynamic";

async function getOrders() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { orders: [] as Order[], error: "Supabase environment variables are missing." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, created_at, reference_code, customer_name, customer_email, deposit_status, order_status, needed_by")
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
          <p className="muted">Public board shows only masked customer details. Open your own order with your email or mobile number and password.</p>
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
                <Link className="card" href={`/orders/${order.id}`} key={order.id}>
                  <div className="card-row">
                    <strong>{order.reference_code}</strong>
                    <span className={`badge ${order.order_status}`}>{statusLabels[order.order_status]}</span>
                  </div>
                  <div>
                    <h3>{maskName(order.customer_name)}</h3>
                    <p className="muted">{maskEmail(order.customer_email)}</p>
                  </div>
                  <div className="meta-list">
                    <p><span>Details</span>Hidden until customer login</p>
                    <p><span>Deposit</span>{depositLabels[order.deposit_status]}</p>
                  </div>
                  <div className="card-row">
                    <span className={`badge ${urgency.label.toLowerCase()}`}>{urgency.label} urgency</span>
                    <span className="muted">{order.deposit_status === "paid" ? "View order" : "View / pay deposit"}</span>
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
