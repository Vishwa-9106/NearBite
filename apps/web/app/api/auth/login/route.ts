import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

const AUTH_COOKIE = "auth_token";
const AUTH_ROLE_COOKIE = "auth_role";

const sessionPayloadSchema = z.object({
  role: z.enum(["user", "restaurant", "admin"]).optional(),
  email: z.string().trim().email("Invalid email address.").optional(),
  password: z.string().min(1, "Password is required.").optional()
});

type SessionRole = "user" | "restaurant" | "admin";

export async function POST(request: NextRequest) {
  let role: SessionRole = "user";
  let email: string | undefined;
  let password: string | undefined;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const rawBody = await request.text();
      if (rawBody.trim().length > 0) {
        const payload = sessionPayloadSchema.parse(JSON.parse(rawBody));
        role = payload.role ?? "user";
        email = payload.email;
        password = payload.password;
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

  if (role === "admin") {
    const adminEmail = process.env.ADMIN_LOGIN_EMAIL;
    const adminPassword = process.env.ADMIN_LOGIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json({ error: "Admin credentials are not configured." }, { status: 500 });
    }

    if (!email || !password || email !== adminEmail || password !== adminPassword) {
      return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
    }
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
