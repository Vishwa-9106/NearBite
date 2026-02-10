import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

const AUTH_COOKIE = "auth_token";
const AUTH_ROLE_COOKIE = "auth_role";

const sessionPayloadSchema = z.object({
  role: z.enum(["user", "restaurant", "admin"]).optional()
});

type SessionRole = "user" | "restaurant" | "admin";

export async function POST(request: NextRequest) {
  let role: SessionRole = "user";

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const rawBody = await request.text();
      if (rawBody.trim().length > 0) {
        const payload = sessionPayloadSchema.parse(JSON.parse(rawBody));
        role = payload.role ?? "user";
      }
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
          issues: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to create session." }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true, role });

  response.cookies.set({
    name: AUTH_COOKIE,
    value: "authenticated",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24
  });

  response.cookies.set({
    name: AUTH_ROLE_COOKIE,
    value: role,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24
  });

  return response;
}
