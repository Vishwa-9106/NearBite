import { NextRequest, NextResponse } from "next/server";
import { userExists } from "../_store";

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "phone query param is required" }, { status: 400 });
  }

  return NextResponse.json({ exists: userExists(phone) });
}
