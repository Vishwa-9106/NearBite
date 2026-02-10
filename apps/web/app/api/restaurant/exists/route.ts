import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { hasRestaurantWithPhone } from "../../../../lib/restaurant-repository";
import { restaurantExistsQuerySchema } from "../../../../lib/restaurant-schemas";

export async function GET(request: NextRequest) {
  try {
    const query = restaurantExistsQuerySchema.parse({
      phone: request.nextUrl.searchParams.get("phone")
    });

    const exists = await hasRestaurantWithPhone(query.phone);

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

    return NextResponse.json({ error: "Failed to check restaurant." }, { status: 500 });
  }
}
