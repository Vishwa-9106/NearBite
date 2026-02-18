import crypto from "node:crypto";
import { redis } from "../clients/redis";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  userId: string;
  role: "user" | "restaurant" | "admin";
};

export async function createSession(payload: SessionPayload) {
  const sessionId = crypto.randomUUID();
  const key = `session:${sessionId}`;

  await redis.set(
    key,
    {
      userId: payload.userId,
      role: payload.role
    },
    { ex: SESSION_TTL_SECONDS }
  );

  return { sessionId, ttlSeconds: SESSION_TTL_SECONDS };
}

export async function getSession(sessionId: string): Promise<SessionPayload | null> {
  const key = `session:${sessionId}`;
  const session = await redis.get<SessionPayload>(key);
  return session ?? null;
}

export async function deleteSession(sessionId: string) {
  const key = `session:${sessionId}`;
  await redis.del(key);
}
