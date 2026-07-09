import { NextResponse } from "next/server";
import { isStaffRequest } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isStaffRequest(request)) return NextResponse.json({ error: "Staff login required." }, { status: 401 });
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
