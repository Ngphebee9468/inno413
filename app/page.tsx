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

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Inno413 Enterprise</p>
          <h1>Custom t-shirts for teams that want to look put together.</h1>
          <p className="hero-text">Design your own, create from us. Upload your artwork, choose your garment, confirm sizes, and start with a 10% deposit.</p>
          <div className="hero-actions">
            <Link className="button" href="/orders/new">Start New Order</Link>
            <Link className="ghost-button" href="#orders">Find My Order</Link>
          </div>
          <div className="service-strip" aria-label="Inno413 services">
            <span>DTF printing</span>
            <span>Corporate uniforms</span>
            <span>Event tees</span>
          </div>
        </div>
        <div className="shirt-showcase" aria-hidden="true">
          <div className="fabric-card fabric-card-primary">
            <div className="shirt-shirt shirt-navy">
              <span className="shirt-team">TEAM</span>
              <span className="shirt-number">413</span>
            </div>
          </div>
          <div className="fabric-card fabric-card-side">
            <div className="shirt-shirt shirt-light">
              <span className="shirt-team">DTF</span>
              <span className="shirt-number">10</span>
            </div>
          </div>
          <div className="swatch-stack">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </section>

      <section className="page" id="orders">
        <div className="page-header board-header">
          <div>
            <p className="eyebrow">Private order board</p>
            <h2>Track your t-shirt order</h2>
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
