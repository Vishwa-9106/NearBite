import type { Request, Response, NextFunction } from "express";
import { env } from "../env";
import { getSession } from "../services/sessions";
import {
  LEGACY_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAMES
} from "../constants/session-cookies";

export type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
    role: "user" | "restaurant" | "admin";
  };
};

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearerToken =
    header && header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;
  const cookieNames = Array.from(
    new Set([...SESSION_COOKIE_NAMES, env.SESSION_COOKIE_NAME, LEGACY_SESSION_COOKIE_NAME])
  );
  const cookieToken =
    typeof req.cookies === "object"
      ? cookieNames
          .map((name) => (req.cookies[name] as string | undefined) ?? null)
          .find((token) => Boolean(token)) ?? null
      : null;
  const token = bearerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ message: "Missing auth token" });
  }

  getSession(token)
    .then((session) => {
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      req.auth = session;
      return next();
    })
    .catch(() => res.status(500).json({ message: "Auth lookup failed" }));
}

export function requireRole(role: "user" | "restaurant" | "admin") {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.auth.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}
