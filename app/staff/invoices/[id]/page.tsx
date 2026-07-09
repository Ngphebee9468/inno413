import { notFound, redirect } from "next/navigation";
import { hasStaffAccess } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function getInvoiceOrderId(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, order_id")
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("[staff:invoice]", error);
  return data?.order_id as string | undefined;
}

export default async function StaffInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await hasStaffAccess())) redirect("/staff/login");
  const { id } = await params;
  const orderId = await getInvoiceOrderId(id);
  if (!orderId) notFound();
  redirect(`/staff/payment-reminder?order=${orderId}&invoice=${id}`);
}
