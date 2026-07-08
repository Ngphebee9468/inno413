import { NextResponse } from "next/server";
import { allowedTransitions } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = (await request.json()) as { status?: string };
    if (!status) return NextResponse.json({ error: "status is required." }, { status: 400 });

    const supabase = createAdminClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_status")
      .eq("id", params.id)
      .single();
    if (error) throw error;

    const allowed = allowedTransitions[order.order_status] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "That status transition is not allowed." }, { status: 400 });
    }

    await supabase.from("orders").update({ order_status: status }).eq("id", params.id);
    await supabase.from("activities").insert({
      entity_type: "orders",
      entity_id: params.id,
      action: "status_changed",
      actor: "staff",
      metadata: { from: order.order_status, to: status },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[orders:status]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Status update failed." }, { status: 500 });
  }
}
