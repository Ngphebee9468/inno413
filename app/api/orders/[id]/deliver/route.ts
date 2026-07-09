import { NextResponse } from "next/server";
import { formatMoney } from "@/lib/orders";
import { isStaffRequest } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, stripeAccountOptions } from "@/lib/stripe";

function addWorkingDays(start: Date, workingDays: number) {
  const date = new Date(start);
  let added = 0;
  while (added < workingDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return date;
}

function estimateSubtotal(order: { preview_config: Record<string, unknown> | null; deposit_amount: number | null }) {
  const previewTotal = order.preview_config?.orderTotal;
  if (typeof previewTotal === "number" && previewTotal > 0) return previewTotal;
  return Number(order.deposit_amount ?? 0) * 10;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isStaffRequest(request)) return NextResponse.json({ error: "Staff login required." }, { status: 401 });
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe secret key is not configured." }, { status: 500 });
    }

    const { id } = await params;
    const supabase = createAdminClient();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, reference_code, customer_name, customer_email, customer_phone, deposit_amount, deposit_status, order_status, preview_config")
      .eq("id", id)
      .single();
    if (orderError) throw orderError;

    const subtotal = Number(estimateSubtotal(order).toFixed(2));
    const depositPaid = order.deposit_status === "paid" ? Number(order.deposit_amount ?? 0) : 0;
    const balanceDue = Number(Math.max(0, subtotal - depositPaid).toFixed(2));
    const dueAt = addWorkingDays(new Date(), 20);
    const dueLabel = dueAt.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });

    const { data: existingInvoices } = await supabase
      .from("invoices")
      .select("*")
      .eq("order_id", id)
      .eq("payment_status", "outstanding")
      .order("created_at", { ascending: false })
      .limit(1);

    let invoice = existingInvoices?.[0];
    if (!invoice) {
      const { data: createdInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          order_id: id,
          subtotal,
          deposit_paid: depositPaid,
          balance_due: balanceDue,
          payment_status: balanceDue === 0 ? "paid" : "outstanding",
          notes: `Balance payment requested after delivery. Payment duration: 20 working days, due by ${dueLabel}.`,
          issued_at: new Date().toISOString(),
          paid_at: balanceDue === 0 ? new Date().toISOString() : null,
        })
        .select("*")
        .single();
      if (invoiceError) throw invoiceError;
      invoice = createdInvoice;
    }

    await supabase.from("orders").update({ order_status: "delivered" }).eq("id", id);

    let paymentUrl = "";
    if (Number(invoice.balance_due ?? 0) > 0) {
      const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
      const session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          customer_email: order.customer_email,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "sgd",
                product_data: { name: `Balance for ${invoice.invoice_number}` },
                unit_amount: Math.round(Number(invoice.balance_due ?? 0) * 100),
              },
            },
          ],
          success_url: `${origin}/orders/payment-success?session_id={CHECKOUT_SESSION_ID}&type=invoice`,
          cancel_url: `${origin}/orders/payment-cancelled?order=${order.reference_code}`,
          metadata: { kind: "invoice", invoiceId: invoice.id, orderId: order.id },
        },
        stripeAccountOptions(),
      );
      paymentUrl = session.url ?? "";
      await supabase.from("invoices").update({ stripe_payment_session_id: session.id }).eq("id", invoice.id);
    }

    await supabase.from("activities").insert({
      entity_type: "orders",
      entity_id: id,
      action: "delivered_balance_requested",
      actor: "staff",
      metadata: {
        balance_due: invoice.balance_due,
        due_date: dueAt.toISOString(),
        invoice_id: invoice.id,
        payment_duration: "20 working days",
      },
    });

    const message = `Hi ${order.customer_name}, your inno413 order ${order.reference_code} has been marked delivered. Please pay the remaining balance of ${formatMoney(invoice.balance_due)} within 20 working days, by ${dueLabel}: ${paymentUrl}`;

    return NextResponse.json({ invoice, message, paymentUrl, dueDate: dueAt.toISOString(), dueLabel });
  } catch (err) {
    console.error("[orders:deliver]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Delivery payment request failed." }, { status: 500 });
  }
}
