import Link from "next/link";
import { notFound } from "next/navigation";
import { depositLabels, formatMoney, statusLabels } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";
import { DepositPaymentActions } from "./DepositPaymentActions";

export const dynamic = "force-dynamic";

async function getOrder(id: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, material_types(*), order_line_items(*), invoices(*)")
    .eq("id", id)
    .single();
  return data as Order | null;
}

export default async function CustomerOrderPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id);
  if (!order) notFound();
  const preview = order.preview_config ?? {};
  const estimatedTotal =
    typeof preview.orderTotal === "number" ? preview.orderTotal : null;
  const unitPrice =
    typeof preview.unitPrice === "number" ? preview.unitPrice : null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">i</span><span>inno413</span></Link>
        <nav className="nav"><Link className="ghost-button" href="/">Orders</Link><Link className="button" href="/orders/new">New Order</Link></nav>
      </header>

      <section className="page">
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
      </section>
    </main>
  );
}
