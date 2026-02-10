import { z } from "zod";

export const mobileNumberSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Invalid mobile number format.");

const optionalEmailSchema = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }

    return value;
  },
  z.string().trim().email("Invalid email address.").optional()
);

export const userExistsQuerySchema = z.object({
  phone: mobileNumberSchema
});

export const createUserPayloadSchema = z.object({
  phone: mobileNumberSchema,
  name: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
  email: optionalEmailSchema
});

export type CreateUserPayload = z.infer<typeof createUserPayloadSchema>;
