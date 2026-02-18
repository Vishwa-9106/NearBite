import { z } from "zod";

export const roleSchema = z.enum(["user", "restaurant", "admin"]);

export const createSessionSchema = z.object({
  idToken: z.string().min(1),
  role: roleSchema
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const otpStartSchema = z.object({
  role: z.enum(["user", "restaurant"]),
  phone: z.string().trim().regex(/^\+91[6-9]\d{9}$/, "Invalid Indian phone number.")
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const updateUserProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .transform((value) => value ?? null)
});

export const updateUserLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().positive().optional(),
  address: z.string().trim().min(3).max(300).optional()
});

export const updateRestaurantProfileSchema = z
  .object({
    ownerName: z.string().trim().min(2).max(120),
    hotelName: z.string().trim().min(2).max(180),
    fssaiNumber: z.string().trim().min(4).max(50).optional(),
    photoUrl: z.string().trim().url().optional()
  })
  .superRefine((value, ctx) => {
    if (!value.fssaiNumber && !value.photoUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either a valid FSSAI number or a document photo URL.",
        path: ["fssaiNumber"]
      });
    }
  });

export const updateRestaurantLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().trim().min(3).max(300).optional()
});

export const reverseGeocodeQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180)
});

export const listApplicationsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional()
});

export const reviewApplicationSchema = z.object({
  reason: z.string().trim().min(3).max(500).optional()
});
