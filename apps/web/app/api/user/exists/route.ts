import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { hasUserWithPhone } from "../../../../lib/user-repository";
import { userExistsQuerySchema } from "../../../../lib/user-schemas";

export async function GET(request: NextRequest) {
  try {
    const query = userExistsQuerySchema.parse({
      phone: request.nextUrl.searchParams.get("phone")
    });

    const exists = await hasUserWithPhone(query.phone);

    return NextResponse.json({ exists });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
          issues: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to check user." }, { status: 500 });
  }
}
