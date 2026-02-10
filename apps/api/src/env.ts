import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

const envCandidates = [
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../../.env"),
  path.resolve(process.cwd(), ".env")
];

for (const envPath of envCandidates) {
  dotenv.config({ path: envPath, override: false });
}

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  NEON_DATABASE_URL: z.string().url()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Invalid environment variables:\n${issues.join("\n")}`);
}

export const env = parsed.data;
