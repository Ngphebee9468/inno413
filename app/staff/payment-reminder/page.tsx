import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { depositLabels, formatMoney, statusLabels } from "@/lib/orders";
import { hasStaffAccess } from "@/lib/staff-auth";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";
import { PaymentReminderActions } from "./PaymentReminderActions";

export const dynamic = "force-dynamic";

async function getOrder(id?: string) {
  if (!id || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, material_types(*), order_line_items(*), invoices(*)")
    .eq("id", id)
    .single();
  return data as Order | null;
}

export default async function PaymentReminderPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  if (!(await hasStaffAccess())) redirect("/staff/login");
  const { order: orderId } = await searchParams;
  const order = await getOrder(orderId);
  if (!order) notFound();
  const invoice = order.invoices?.[0];

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
            <h1>Payment reminder</h1>
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
              <p><span>Phone</span>{order.customer_phone ?? "No phone provided"}</p>
            </div>
          </section>
          <section className="card">
            <h2>Payment</h2>
            <div className="meta-list">
              <p><span>Deposit due</span>{formatMoney(order.deposit_amount)}</p>
              <p><span>Invoice</span>{invoice ? `${invoice.invoice_number} / ${invoice.payment_status}` : "No final invoice yet"}</p>
              <p><span>Quantity</span>{order.total_quantity} pieces</p>
            </div>
          </section>
        </div>

        <section style={{ marginTop: 18 }}>
          <PaymentReminderActions order={order} />
        </section>
      </section>
    </main>
  );
}
