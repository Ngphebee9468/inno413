import { NextResponse } from "next/server";
import { staffCookie } from "@/lib/staff-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(staffCookie.name, "", { maxAge: 0, path: "/" });
  return response;
}
