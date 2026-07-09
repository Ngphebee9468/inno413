import { NextResponse } from "next/server";
import { isStaffRequest } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isStaffRequest(request)) return NextResponse.json({ error: "Staff login required." }, { status: 401 });
    const { id } = await params;
    const { staff_notes } = (await request.json()) as { staff_notes?: string };
    const supabase = createAdminClient();

    await supabase.from("orders").update({ staff_notes: staff_notes ?? "" }).eq("id", id);
    await supabase.from("activities").insert({
      entity_type: "orders",
      entity_id: id,
      action: "notes_updated",
      actor: "staff",
      metadata: { length: staff_notes?.length ?? 0 },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[orders:notes]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Notes update failed." }, { status: 500 });
  }
}
