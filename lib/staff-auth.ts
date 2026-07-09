import crypto from "crypto";
import { cookies } from "next/headers";

const cookieName = "staff_session";
const maxAgeSeconds = 60 * 60 * 24 * 7;

function getStaffPassword() {
  return process.env.STAFF_ACCESS_PASSWORD ?? "inno413staff";
}

function getStaffSecret() {
  return process.env.STAFF_SESSION_SECRET ?? `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "inno413"}:staff`;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getStaffSecret()).update(payload).digest("hex");
}

export function createStaffSessionToken() {
  const payload = `staff:${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyStaffPassword(password: string) {
  const supplied = Buffer.from(password);
  const expected = Buffer.from(getStaffPassword());
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

export function verifyStaffSessionToken(token?: string) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  const [kind, issuedAt] = payload?.split(":") ?? [];
  if (kind !== "staff" || !issuedAt || !signature) return false;
  if (sign(payload) !== signature) return false;
  const ageSeconds = (Date.now() - Number(issuedAt)) / 1000;
  return Number.isFinite(ageSeconds) && ageSeconds >= 0 && ageSeconds <= maxAgeSeconds;
}

export async function hasStaffAccess() {
  const cookieStore = await cookies();
  return verifyStaffSessionToken(cookieStore.get(cookieName)?.value);
}

export function isStaffRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  return verifyStaffSessionToken(token);
}

export const staffCookie = {
  name: cookieName,
  maxAge: maxAgeSeconds,
};
