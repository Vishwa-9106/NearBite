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

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGINS: z.string().min(1),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().min(1),
  FIREBASE_STORAGE_BUCKET: z.string().min(1).optional(),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  SESSION_COOKIE_NAME: z.string().min(1).default("nearbite_session"),
  SESSION_COOKIE_DOMAIN: z.string().optional(),
  SESSION_COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  SESSION_COOKIE_SECURE: booleanFromEnv.default(false),
  GOOGLE_MAPS_API_KEY: z.string().min(1),
  AUTH_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  AUTH_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
  OTP_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(8),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  NEON_DATABASE_URL: z.string().url()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Invalid environment variables:\n${issues.join("\n")}`);
}

if (parsed.data.SESSION_COOKIE_SAME_SITE === "none" && !parsed.data.SESSION_COOKIE_SECURE) {
  throw new Error("SESSION_COOKIE_SECURE must be true when SESSION_COOKIE_SAME_SITE is none.");
}

export const env = parsed.data;
