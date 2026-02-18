import { Router, type Response } from "express";
import { ZodError } from "zod";
import { adminLoginSchema, createSessionSchema, otpStartSchema } from "../schemas";
import { getFirebaseAuth } from "../services/firebase";
import { createSession, deleteSession } from "../services/sessions";
import {
  getUserById,
  getUserLocation,
  upsertUserByPhone
} from "../db/users";
import {
  hasRestaurantLocation,
  hasRestaurantProfile,
  getRestaurantById,
  upsertRestaurantByPhone
} from "../db/restaurants";
import {
  LEGACY_SESSION_COOKIE_NAME,
  getSessionCookieName,
  SESSION_COOKIE_NAMES,
  type SessionCookieRole
} from "../constants/session-cookies";
import { env } from "../env";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { applyRateLimit } from "../services/rate-limit";

export const authRouter = Router();

authRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

function getCookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true as const,
    path: "/",
    sameSite: env.SESSION_COOKIE_SAME_SITE,
    secure: env.SESSION_COOKIE_SECURE,
    maxAge: maxAgeMs,
    ...(env.SESSION_COOKIE_DOMAIN ? { domain: env.SESSION_COOKIE_DOMAIN } : {})
  };
}

function getClearCookieOptions() {
  return {
    httpOnly: true as const,
    path: "/",
    sameSite: env.SESSION_COOKIE_SAME_SITE,
    secure: env.SESSION_COOKIE_SECURE,
    ...(env.SESSION_COOKIE_DOMAIN ? { domain: env.SESSION_COOKIE_DOMAIN } : {})
  };
}

function clearSessionCookies(res: Response, keepRole?: SessionCookieRole) {
  const cookieNames = Array.from(
    new Set([...SESSION_COOKIE_NAMES, env.SESSION_COOKIE_NAME, LEGACY_SESSION_COOKIE_NAME])
  );

  for (const cookieName of cookieNames) {
    if (keepRole && cookieName === getSessionCookieName(keepRole)) {
      continue;
    }
    res.clearCookie(cookieName, getClearCookieOptions());
  }
}

async function enforceAuthRateLimit(identifier: string) {
  return applyRateLimit(`auth:${identifier}`, {
    windowSeconds: env.AUTH_RATE_LIMIT_WINDOW_SECONDS,
    maxAttempts: env.AUTH_RATE_LIMIT_MAX_ATTEMPTS
  });
}

async function enforceOtpRateLimit(identifier: string) {
  return applyRateLimit(`otp:${identifier}`, {
    windowSeconds: env.OTP_RATE_LIMIT_WINDOW_SECONDS,
    maxAttempts: env.OTP_RATE_LIMIT_MAX_ATTEMPTS
  });
}

authRouter.post("/otp/start", async (req, res) => {
  try {
    const payload = otpStartSchema.parse(req.body);
    const ip = req.ip || "unknown";
    const limitKey = `start:${payload.role}:${payload.phone}:${ip}`;
    const rateLimit = await enforceOtpRateLimit(limitKey);

    if (!rateLimit.allowed) {
      return res.status(429).json({
        message: "Too many OTP attempts. Please try again in a minute.",
        retryAfterSeconds: rateLimit.resetInSeconds
      });
    }

    return res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }

    return res.status(500).json({ message: "Failed to validate OTP request" });
  }
});

authRouter.post("/session", async (req, res) => {
  try {
    const ip = req.ip || "unknown";
    const rateLimit = await enforceAuthRateLimit(`session:${ip}`);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        message: "Too many authentication attempts. Please try again later.",
        retryAfterSeconds: rateLimit.resetInSeconds
      });
    }

    const payload = createSessionSchema.parse(req.body);

    if (payload.role === "admin") {
      return res.status(400).json({ message: "Admin must use admin login." });
    }

    const auth = getFirebaseAuth();
    const decoded = await auth.verifyIdToken(payload.idToken);
    let phone = decoded.phone_number ?? null;

    if (!phone) {
      const userRecord = await auth.getUser(decoded.uid).catch(() => null);
      phone = userRecord?.phoneNumber ?? null;
    }

    if (!phone) {
      return res.status(400).json({ message: "Firebase token missing phone number." });
    }

    let userId: string;
    let nextStep: string;
    let applicationStatus: string | null = null;

    if (payload.role === "user") {
      userId = await upsertUserByPhone({
        phone,
        firebaseUid: decoded.uid
      });

      const [user, location] = await Promise.all([getUserById(userId), getUserLocation(userId)]);
      nextStep = Boolean(user?.name && location) ? "user_dashboard" : "user_onboarding";
    } else {
      userId = await upsertRestaurantByPhone({
        phone,
        firebaseUid: decoded.uid
      });

      const restaurant = await getRestaurantById(userId);
      applicationStatus = restaurant?.status ?? null;

      if (!restaurant || !hasRestaurantProfile(restaurant) || !hasRestaurantLocation(restaurant)) {
        nextStep = "restaurant_onboarding";
      } else if (applicationStatus === "approved") {
        nextStep = "restaurant_dashboard";
      } else if (applicationStatus === "pending" || applicationStatus === "rejected") {
        nextStep = "restaurant_application_status";
      } else {
        nextStep = "restaurant_onboarding";
      }
    }

    const session = await createSession({ userId, role: payload.role });
    const sessionCookieName = getSessionCookieName(payload.role);

    clearSessionCookies(res, payload.role);
    res.cookie(sessionCookieName, session.sessionId, getCookieOptions(session.ttlSeconds * 1000));

    return res.status(201).json({
      role: payload.role,
      userId,
      phone,
      nextStep,
      applicationStatus
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
    ) {
      return res.status(401).json({ message: "Invalid Firebase token" });
    }

    return res.status(500).json({ message: "Failed to create session" });
  }
});

authRouter.post("/admin/login", async (req, res) => {
  try {
    const ip = req.ip || "unknown";
    const rateLimit = await enforceAuthRateLimit(`admin:${ip}`);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        message: "Too many authentication attempts. Please try again later.",
        retryAfterSeconds: rateLimit.resetInSeconds
      });
    }

    const payload = adminLoginSchema.parse(req.body);

    if (payload.email !== env.ADMIN_EMAIL || payload.password !== env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const session = await createSession({ userId: "admin", role: "admin" });
    const sessionCookieName = getSessionCookieName("admin");

    clearSessionCookies(res, "admin");
    res.cookie(sessionCookieName, session.sessionId, getCookieOptions(session.ttlSeconds * 1000));

    return res.status(201).json({
      role: "admin",
      userId: "admin"
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }

    return res.status(500).json({ message: "Failed to login admin" });
  }
});

authRouter.get("/me", requireAuth, (req: AuthenticatedRequest, res) => {
  return res.json({
    userId: req.auth?.userId,
    role: req.auth?.role
  });
});

authRouter.post("/logout", requireAuth, async (req: AuthenticatedRequest, res) => {
  const header = req.headers.authorization ?? "";
  const bearerToken = header.replace("Bearer ", "").trim();
  const cookieNames = Array.from(
    new Set([...SESSION_COOKIE_NAMES, env.SESSION_COOKIE_NAME, LEGACY_SESSION_COOKIE_NAME])
  );
  const cookieTokens =
    typeof req.cookies === "object"
      ? cookieNames
          .map((name) => (req.cookies[name] as string | undefined) ?? null)
          .filter((token): token is string => Boolean(token))
      : [];
  const tokens = Array.from(new Set([bearerToken, ...cookieTokens].filter(Boolean)));

  if (tokens.length > 0) {
    await Promise.all(tokens.map((token) => deleteSession(token)));
  }

  clearSessionCookies(res);
  return res.status(204).send();
});
