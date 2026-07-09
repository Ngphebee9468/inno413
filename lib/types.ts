export type OrderStatus =
  | "pending"
  | "in_review"
  | "in_production"
  | "ready"
  | "delivered"
  | "cancelled";

export type DepositStatus = "unpaid" | "paid" | "waived";
export type PaymentStatus = "outstanding" | "paid" | "partial" | "waived";

export type MaterialType = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
};

export type LineItem = {
  id?: string;
  order_id?: string;
  size: string;
  quantity: number;
  unit_price?: number | null;
  colour?: string | null;
  custom_text?: string | null;
};

export type Invoice = {
  id: string;
  order_id: string;
  invoice_number: string;
  subtotal: number;
  deposit_paid: number;
  balance_due: number;
  payment_status: PaymentStatus;
  stripe_payment_session_id: string | null;
  notes: string | null;
  issued_at: string | null;
  paid_at: string | null;
  created_at: string;
};

export type Activity = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type Order = {
  id: string;
  created_at: string;
  reference_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  access_password_hash?: string | null;
  design_service: string;
  design_file_url: string | null;
  design_notes: string | null;
  material_type_id: string | null;
  garment_type: string;
  base_colour: string | null;
  preview_config: Record<string, unknown> | null;
  delivery_address: string | null;
  delivery_method: string | null;
  needed_by: string | null;
  total_quantity: number;
  deposit_amount: number | null;
  deposit_status: DepositStatus;
  stripe_deposit_session_id: string | null;
  order_status: OrderStatus;
  staff_notes: string | null;
  material_types?: MaterialType | null;
  order_line_items?: LineItem[];
  invoices?: Invoice[];
  activities?: Activity[];
};

export type OrderPayload = {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  access_password?: string;
  design_service: string;
  design_file_url?: string;
  design_notes?: string;
  material_type_id: string;
  garment_type: string;
  base_colour: string;
  preview_config: Record<string, unknown>;
  delivery_address?: string;
  delivery_method: string;
  needed_by: string;
  line_items: LineItem[];
};
