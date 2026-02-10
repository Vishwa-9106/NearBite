import { NextRequest, NextResponse } from "next/server";
import { createUser } from "../_store";

type CreateUserPayload = {
  phone?: string;
  username?: string;
  email?: string;
};

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as CreateUserPayload;

  if (!payload.phone || !payload.username?.trim()) {
    return NextResponse.json(
      { error: "phone and username are required" },
      { status: 400 }
    );
  }

  createUser({
    phone: payload.phone,
    username: payload.username.trim(),
    email: payload.email?.trim() || undefined
  });

  return NextResponse.json({ created: true });
}
