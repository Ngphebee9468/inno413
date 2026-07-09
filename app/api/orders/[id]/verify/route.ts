import { NextResponse } from "next/server";
import { hashOrderPassword, matchesOrderIdentity } from "@/lib/order-access";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/lib/types";

type SecureOrder = Order & { access_password_hash?: string | null };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { identity, password } = (await request.json()) as { identity?: string; password?: string };
    if (!identity || !password) {
      return NextResponse.json({ error: "Email or mobile number and password are required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*, material_types(*), order_line_items(*), invoices(*)")
      .eq("id", id)
      .single();
    if (error || !data) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const order = data as SecureOrder;
    if (!order.access_password_hash) {
      return NextResponse.json({ error: "This order does not have customer password access yet. Please contact staff." }, { status: 403 });
    }
    if (!matchesOrderIdentity(order, identity) || order.access_password_hash !== hashOrderPassword(password)) {
      return NextResponse.json({ error: "The details entered do not match this order." }, { status: 403 });
    }

    const { access_password_hash: _hidden, ...safeOrder } = order;
    return NextResponse.json({ order: safeOrder });
  } catch (err) {
    console.error("[orders:verify]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Order access failed." }, { status: 500 });
  }
}
