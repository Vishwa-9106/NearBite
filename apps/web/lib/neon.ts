import { neon } from "@neondatabase/serverless";
import { z } from "zod";

const envSchema = z.object({
  NEON_DATABASE_URL: z.string().url()
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");

  throw new Error(`Invalid server environment for Neon client: ${issues}`);
}

export const sql = neon(parsedEnv.data.NEON_DATABASE_URL);
