import { NextResponse } from "next/server";
import { createStaffSessionToken, staffCookie, verifyStaffPassword } from "@/lib/staff-auth";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };
  if (!password || !verifyStaffPassword(password)) {
    return NextResponse.json({ error: "Incorrect staff password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(staffCookie.name, createStaffSessionToken(), {
    httpOnly: true,
    maxAge: staffCookie.maxAge,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
