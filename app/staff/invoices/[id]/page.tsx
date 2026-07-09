import { notFound, redirect } from "next/navigation";
import { hasStaffAccess } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function getInvoiceOrderId(id: string) {
  const supabase = createAdminClient();
  const decodedId = decodeURIComponent(id);
  const { data, error } = await supabase
    .from("invoices")
    .select("id, order_id")
    .or(`id.eq.${decodedId},invoice_number.eq.${decodedId}`)
    .maybeSingle();
  if (error) console.error("[staff:invoice]", error);
  return data as { id: string; order_id: string } | null;
}

export default async function StaffInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await hasStaffAccess())) redirect("/staff/login");
  const { id } = await params;
  const invoice = await getInvoiceOrderId(id);
  if (!invoice?.order_id) notFound();
  redirect(`/staff/payment-reminder?order=${invoice.order_id}&invoice=${invoice.id}`);
}
