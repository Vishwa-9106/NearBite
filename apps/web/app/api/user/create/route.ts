import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createUserRecord } from "../../../../lib/user-repository";
import { createUserPayloadSchema } from "../../../../lib/user-schemas";

export async function POST(request: NextRequest) {
  try {
    const payload = createUserPayloadSchema.parse(await request.json());
    const created = await createUserRecord(payload);

    return NextResponse.json({ created });
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

    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}
