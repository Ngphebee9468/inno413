import crypto from "crypto";

const orderPasswordPepper = process.env.ORDER_PASSWORD_PEPPER ?? "inno413-order-access";

export function hashOrderPassword(password: string) {
  return crypto.createHash("sha256").update(`${orderPasswordPepper}:${password}`).digest("hex");
}

export function normalisePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function matchesOrderIdentity(order: { customer_email: string; customer_phone: string | null }, identity: string) {
  const cleanedIdentity = identity.trim().toLowerCase();
  if (!cleanedIdentity) return false;
  if (cleanedIdentity === order.customer_email.trim().toLowerCase()) return true;

  const phone = normalisePhone(order.customer_phone ?? "");
  const suppliedPhone = normalisePhone(cleanedIdentity);
  return Boolean(phone && suppliedPhone && phone.endsWith(suppliedPhone));
}
