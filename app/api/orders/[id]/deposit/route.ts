import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    await supabase.from("orders").update({ deposit_status: "paid" }).eq("id", params.id);
    await supabase.from("activities").insert({
      entity_type: "orders",
      entity_id: params.id,
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
