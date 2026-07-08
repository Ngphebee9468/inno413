import type { Order } from "@/lib/types";

export const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_review: "In Review",
  in_production: "In Production",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const depositLabels: Record<string, string> = {
  unpaid: "Deposit Unpaid",
  paid: "Deposit Paid",
  waived: "Deposit Waived",
};

export function getUrgency(order: Pick<Order, "needed_by" | "created_at">) {
  if (!order.needed_by) return { label: "No Deadline", score: 0 };
  const due = new Date(`${order.needed_by}T00:00:00`);
  const days = Math.ceil((due.getTime() - Date.now()) / 86_400_000);

  if (days <= 7) return { label: "High", score: 3 };
  if (days <= 14) return { label: "Medium", score: 2 };
  return { label: "Low", score: 1 };
}

export function formatMoney(value?: number | null) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
  }).format(Number(value ?? 0));
}

export function computeDeposit(totalQuantity: number) {
  return Math.max(50, Math.min(250, totalQuantity * 5));
}

export const allowedTransitions: Record<string, string[]> = {
  pending: ["in_review", "cancelled"],
  in_review: ["in_production", "cancelled"],
  in_production: ["ready", "cancelled"],
  ready: ["delivered"],
  delivered: [],
  cancelled: [],
};
