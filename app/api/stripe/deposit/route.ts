import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, stripeAccountOptions } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { orderId } = (await request.json()) as { orderId?: string };
    if (!orderId) return NextResponse.json({ error: "orderId is required." }, { status: 400 });

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe secret key is not configured." }, { status: 500 });
    }

    const supabase = createAdminClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, reference_code, customer_email, deposit_amount")
      .eq("id", orderId)
      .single();
    if (error) throw error;

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: order.customer_email,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "myr",
              product_data: { name: `Deposit for ${order.reference_code}` },
              unit_amount: Math.round(Number(order.deposit_amount ?? 0) * 100),
            },
          },
        ],
        success_url: `${origin}/orders/payment-success?session_id={CHECKOUT_SESSION_ID}&type=deposit`,
        cancel_url: `${origin}/orders/payment-cancelled?order=${order.reference_code}`,
        metadata: { kind: "deposit", orderId: order.id },
      },
      stripeAccountOptions(),
    );

    await supabase
      .from("orders")
      .update({ stripe_deposit_session_id: session.id })
      .eq("id", order.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe:deposit]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Deposit checkout failed." }, { status: 500 });
  }
}
