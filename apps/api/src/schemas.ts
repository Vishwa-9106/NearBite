import { z } from "zod";

export const roleSchema = z.enum(["user", "restaurant", "admin"]);

export const createSessionSchema = z.object({
  userId: z.string().min(1),
  role: roleSchema
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
