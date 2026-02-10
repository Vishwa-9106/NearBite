import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createRestaurantRecord } from "../../../../lib/restaurant-repository";
import {
  restaurantBasicDetailsSchema,
  restaurantExistsQuerySchema,
  restaurantLocationSchema
} from "../../../../lib/restaurant-schemas";

export const runtime = "nodejs";

const MAX_FSSAI_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp"
]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg", ".webp"]);

type UploadInput = {
  phone: string;
  restaurantName: string;
  ownerName: string;
  googleMapsLink: string;
};

function getUploadSubDirectory(): string {
  const configured = process.env.RESTAURANT_UPLOAD_SUBDIR?.trim();
  if (!configured) {
    return "uploads/fssai";
  }

  return configured.replace(/^\/+|\/+$/g, "");
}

function isAllowedFileType(file: File): boolean {
  const extension = path.extname(file.name).toLowerCase();
  return ALLOWED_MIME_TYPES.has(file.type) || ALLOWED_EXTENSIONS.has(extension);
}

function getFileExtension(file: File): string {
  const extension = path.extname(file.name).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(extension)) {
    return extension;
  }

  if (file.type === "application/pdf") {
    return ".pdf";
  }

  if (file.type === "image/png") {
    return ".png";
  }

  if (file.type === "image/webp") {
    return ".webp";
  }

  return ".jpg";
}

function parseUploadInput(input: UploadInput) {
  const phone = restaurantExistsQuerySchema.parse({ phone: input.phone }).phone;
  const basicDetails = restaurantBasicDetailsSchema.parse({
    restaurantName: input.restaurantName,
    ownerName: input.ownerName
  });
  const location = restaurantLocationSchema.parse({
    googleMapsLink: input.googleMapsLink
  });

  return {
    phone,
    ...basicDetails,
    ...location
  };
}

export async function POST(request: NextRequest) {
  let uploadedFilePath = "";

  try {
    const formData = await request.formData();
    const fileField = formData.get("fssaiLicense");

    if (!(fileField instanceof File) || fileField.size === 0) {
      return NextResponse.json({ error: "FSSAI license file is required." }, { status: 400 });
    }

    if (fileField.size > MAX_FSSAI_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "FSSAI file must be 5MB or smaller." }, { status: 400 });
    }

    if (!isAllowedFileType(fileField)) {
      return NextResponse.json({ error: "Upload a PDF or image for FSSAI license." }, { status: 400 });
    }

    const parsedInput = parseUploadInput({
      phone: String(formData.get("phone") ?? ""),
      restaurantName: String(formData.get("restaurantName") ?? ""),
      ownerName: String(formData.get("ownerName") ?? ""),
      googleMapsLink: String(formData.get("googleMapsLink") ?? "")
    });

    const extension = getFileExtension(fileField);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const uploadSubDirectory = getUploadSubDirectory();
    const uploadDirectory = path.join(process.cwd(), "public", uploadSubDirectory);

    await mkdir(uploadDirectory, { recursive: true });

    uploadedFilePath = path.join(uploadDirectory, fileName);
    await writeFile(uploadedFilePath, Buffer.from(await fileField.arrayBuffer()));

    const created = await createRestaurantRecord({
      ...parsedInput,
      fssaiLicenseUrl: `/${uploadSubDirectory}/${fileName}`,
      verificationStatus: "pending"
    });

    if (!created) {
      await unlink(uploadedFilePath).catch(() => undefined);
      return NextResponse.json({ error: "Restaurant account already exists." }, { status: 409 });
    }

    return NextResponse.json({
      created: true,
      verificationStatus: "pending"
    });
  } catch (error) {
    if (error instanceof ZodError) {
      if (uploadedFilePath) {
        await unlink(uploadedFilePath).catch(() => undefined);
      }

      return NextResponse.json(
        {
          error: "Invalid request payload.",
          issues: error.issues
        },
        { status: 400 }
      );
    }

    if (uploadedFilePath) {
      await unlink(uploadedFilePath).catch(() => undefined);
    }

    return NextResponse.json({ error: "Failed to create restaurant." }, { status: 500 });
  }
}
