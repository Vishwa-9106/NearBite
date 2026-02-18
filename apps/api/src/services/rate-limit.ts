import { redis } from "../clients/redis";
import { env } from "../env";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
};

type RateLimitOptions = {
  windowSeconds: number;
  maxAttempts: number;
};

export async function applyRateLimit(
  key: string,
  options?: RateLimitOptions
): Promise<RateLimitResult> {
  const windowSeconds = options?.windowSeconds ?? env.AUTH_RATE_LIMIT_WINDOW_SECONDS;
  const maxAttempts = options?.maxAttempts ?? env.AUTH_RATE_LIMIT_MAX_ATTEMPTS;
  const namespacedKey = `rate_limit:${key}`;
  const current = await redis.incr(namespacedKey);

  if (current === 1) {
    await redis.expire(namespacedKey, windowSeconds);
  }

  const remaining = Math.max(maxAttempts - current, 0);
  const allowed = current <= maxAttempts;

  return {
    allowed,
    remaining,
    resetInSeconds: windowSeconds
  };
}
