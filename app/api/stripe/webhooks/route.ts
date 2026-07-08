import { constructWebhookEvent } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(payload, signature);
  } catch (err) {
    console.error("[stripe:webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const kind = session.metadata?.kind;

      if (kind === "deposit" && session.metadata?.orderId) {
        await supabase
          .from("orders")
          .update({ deposit_status: "paid", stripe_deposit_session_id: session.id })
          .eq("id", session.metadata.orderId);
        await supabase.from("activities").insert({
          entity_type: "orders",
          entity_id: session.metadata.orderId,
          action: "deposit_paid",
          actor: "stripe",
          metadata: { stripe_session_id: session.id, amount_total: session.amount_total },
        });
      }

      if (kind === "invoice" && session.metadata?.invoiceId && session.metadata?.orderId) {
        await supabase
          .from("invoices")
          .update({
            payment_status: "paid",
            paid_at: new Date().toISOString(),
            stripe_payment_session_id: session.id,
          })
          .eq("id", session.metadata.invoiceId);
        await supabase.from("activities").insert({
          entity_type: "invoices",
          entity_id: session.metadata.invoiceId,
          action: "invoice_paid",
          actor: "stripe",
          metadata: { order_id: session.metadata.orderId, stripe_session_id: session.id, amount_total: session.amount_total },
        });
      }
    }
  } catch (err) {
    console.error(`[stripe:webhook] handler failed for ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
