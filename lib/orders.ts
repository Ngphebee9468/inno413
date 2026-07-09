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
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(Number(value ?? 0));
}

export const garmentPricing = {
  tshirt: {
    label: "DRIFIT t-shirt (round-neck)",
    tiers: [
      { min: 31, unitPrice: 8.5 },
      { min: 10, unitPrice: 9 },
      { min: 1, unitPrice: 10 },
    ],
  },
  polo: {
    label: "POLO t-shirt",
    tiers: [
      { min: 31, unitPrice: 10.5 },
      { min: 10, unitPrice: 11 },
      { min: 1, unitPrice: 12 },
    ],
  },
  jersey: {
    label: "JERSEY print",
    tiers: [
      { min: 31, unitPrice: 12.5 },
      { min: 10, unitPrice: 13.5 },
      { min: 1, unitPrice: 15 },
    ],
  },
} as const;

export type PricedGarmentType = keyof typeof garmentPricing;

export function getUnitPrice(garmentType: string, totalQuantity: number) {
  const pricing = garmentPricing[(garmentType as PricedGarmentType) || "jersey"] ?? garmentPricing.jersey;
  return pricing.tiers.find((tier) => totalQuantity >= tier.min)?.unitPrice ?? pricing.tiers.at(-1)?.unitPrice ?? 0;
}

export function computeOrderTotal(garmentType: string, totalQuantity: number) {
  return Number((getUnitPrice(garmentType, totalQuantity) * totalQuantity).toFixed(2));
}

export function computeDeposit(totalOrQuantity: number, garmentType?: string) {
  const orderTotal = garmentType
    ? computeOrderTotal(garmentType, totalOrQuantity)
    : totalOrQuantity;
  return Number((orderTotal * 0.1).toFixed(2));
}

export const allowedTransitions: Record<string, string[]> = {
  pending: ["in_review", "cancelled"],
  in_review: ["in_production", "cancelled"],
  in_production: ["ready", "cancelled"],
  ready: ["delivered"],
  delivered: [],
  cancelled: [],
};
