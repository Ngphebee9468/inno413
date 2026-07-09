import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    await supabase.from("orders").update({ deposit_status: "paid" }).eq("id", id);
    await supabase.from("activities").insert({
      entity_type: "orders",
      entity_id: id,
      action: "deposit_paid",
      actor: "staff",
      metadata: { source: "offline" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[orders:deposit]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Deposit update failed." }, { status: 500 });
  }
}
