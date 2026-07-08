import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, stripeAccountOptions } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { invoiceId } = (await request.json()) as { invoiceId?: string };
    if (!invoiceId) return NextResponse.json({ error: "invoiceId is required." }, { status: 400 });
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe secret key is not configured." }, { status: 500 });
    }

    const supabase = createAdminClient();
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*, orders(reference_code, customer_email)")
      .eq("id", invoiceId)
      .single();
    if (error) throw error;

    const order = Array.isArray(invoice.orders) ? invoice.orders[0] : invoice.orders;
    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: order?.customer_email,
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
        cancel_url: `${origin}/orders/payment-cancelled?order=${order?.reference_code ?? invoice.invoice_number}`,
        metadata: { kind: "invoice", invoiceId: invoice.id, orderId: invoice.order_id },
      },
      stripeAccountOptions(),
    );

    await supabase
      .from("invoices")
      .update({ stripe_payment_session_id: session.id })
      .eq("id", invoice.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe:invoice]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invoice checkout failed." }, { status: 500 });
  }
}
