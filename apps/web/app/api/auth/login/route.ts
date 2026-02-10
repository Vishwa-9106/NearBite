import { NextResponse } from "next/server";

const AUTH_COOKIE = "auth_token";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: AUTH_COOKIE,
    value: "authenticated",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24
  });

  return response;
}
