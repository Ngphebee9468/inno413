import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeDeposit } from "@/lib/orders";
import type { OrderPayload } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderPayload;
    const lineItems = body.line_items ?? [];
    const totalQuantity = lineItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    if (!body.customer_name || !body.customer_email || !body.material_type_id || totalQuantity <= 0) {
      return NextResponse.json({ error: "Missing required order details." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const depositAmount = computeDeposit(totalQuantity);
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone ?? null,
        design_service: body.design_service,
        design_file_url: body.design_file_url ?? null,
        design_notes: body.design_notes ?? null,
        material_type_id: body.material_type_id,
        garment_type: body.garment_type,
        base_colour: body.base_colour,
        preview_config: body.preview_config,
        delivery_address: body.delivery_address ?? null,
        delivery_method: body.delivery_method,
        needed_by: body.needed_by,
        total_quantity: totalQuantity,
        deposit_amount: depositAmount,
        deposit_status: "unpaid",
        order_status: "pending",
      })
      .select("id, reference_code")
      .single();

    if (orderError) throw orderError;

    const { error: itemsError } = await supabase.from("order_line_items").insert(
      lineItems.map((item) => ({
        order_id: order.id,
        size: item.size,
        quantity: Number(item.quantity),
        colour: item.colour ?? body.base_colour,
        custom_text: item.custom_text ?? null,
      })),
    );
    if (itemsError) throw itemsError;

    await supabase.from("activities").insert({
      entity_type: "orders",
      entity_id: order.id,
      action: "order_submitted",
      actor: "customer",
      metadata: { total_quantity: totalQuantity, deposit_amount: depositAmount },
    });

    return NextResponse.json(order);
  } catch (err) {
    console.error("[orders:create]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Order failed." }, { status: 500 });
  }
}
