import { z } from "zod";
import { mobileNumberSchema } from "./user-schemas";

export const restaurantExistsQuerySchema = z.object({
  phone: mobileNumberSchema
});

export const restaurantBasicDetailsSchema = z.object({
  restaurantName: z
    .string()
    .trim()
    .min(1, "Hotel / Restaurant name is required.")
    .max(160, "Hotel / Restaurant name is too long."),
  ownerName: z.string().trim().min(1, "Owner name is required.").max(120, "Owner name is too long.")
});

export const restaurantLocationSchema = z.object({
  googleMapsLink: z
    .string()
    .trim()
    .url("Enter a valid Google Maps hotel location link.")
    .refine((value) => {
      try {
        const host = new URL(value).hostname.toLowerCase();
        return host.includes("google.") || host.includes("goo.gl");
      } catch {
        return false;
      }
    }, "Enter a valid Google Maps hotel location link.")
});

export const restaurantCreatePayloadSchema = restaurantBasicDetailsSchema.merge(restaurantLocationSchema).extend({
  phone: mobileNumberSchema,
  fssaiLicenseUrl: z.string().trim().min(1, "FSSAI license URL is required."),
  verificationStatus: z.enum(["pending", "verified"]).default("pending")
});

export type CreateRestaurantPayload = z.infer<typeof restaurantCreatePayloadSchema>;
