import { NextResponse } from "next/server";
import { isStaffRequest } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isStaffRequest(request)) return NextResponse.json({ error: "Staff login required." }, { status: 401 });
    const { id } = await params;
    const { subtotal, deposit_paid, notes } = (await request.json()) as {
      subtotal?: number;
      deposit_paid?: number;
      notes?: string;
    };

    if (!subtotal || subtotal <= 0) {
      return NextResponse.json({ error: "Invoice total must be greater than zero." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const balanceDue = Math.max(0, Number(subtotal) - Number(deposit_paid ?? 0));
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        order_id: id,
        subtotal,
        deposit_paid: deposit_paid ?? 0,
        balance_due: balanceDue,
        payment_status: balanceDue === 0 ? "paid" : "outstanding",
        notes: notes ?? null,
        issued_at: new Date().toISOString(),
        paid_at: balanceDue === 0 ? new Date().toISOString() : null,
      })
      .select("*")
      .single();

    if (error) throw error;

    await supabase.from("activities").insert({
      entity_type: "invoices",
      entity_id: invoice.id,
      action: "invoice_created",
      actor: "staff",
      metadata: { order_id: id, subtotal, balance_due: balanceDue },
    });

    return NextResponse.json(invoice);
  } catch (err) {
    console.error("[orders:invoice]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invoice creation failed." }, { status: 500 });
  }
}
