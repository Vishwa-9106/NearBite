import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { sql } from "./clients/neon";
import { redis } from "./clients/redis";
import { env } from "./env";
import { createSessionSchema } from "./schemas";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    const dbRows = await sql("select now() as now");
    const neonTime =
      Array.isArray(dbRows) &&
      dbRows.length > 0 &&
      typeof dbRows[0] === "object" &&
      dbRows[0] !== null &&
      "now" in dbRows[0]
        ? String((dbRows[0] as { now: unknown }).now)
        : null;

    await redis.set("health:last_check", new Date().toISOString(), { ex: 60 });

    res.json({
      status: "ok",
      service: "api",
      neonTime
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      detail: error instanceof Error ? error.message : "unknown_error"
    });
  }
});

app.post("/api/session", async (req, res) => {
  try {
    const payload = createSessionSchema.parse(req.body);
    const redisKey = `session:${payload.role}:${payload.userId}`;

    await redis.set(
      redisKey,
      {
        role: payload.role,
        userId: payload.userId,
        createdAt: new Date().toISOString()
      },
      { ex: 60 * 60 }
    );

    res.status(201).json({
      ok: true,
      key: redisKey
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        ok: false,
        message: "Invalid payload",
        issues: error.issues
      });
    }

    return res.status(500).json({
      ok: false,
      message: "Failed to create session"
    });
  }
});

app.get("/api/:role/ping", (req, res) => {
  const parsedRole = createSessionSchema.shape.role.safeParse(req.params.role);

  if (!parsedRole.success) {
    return res.status(400).json({ message: "Invalid role" });
  }

  return res.json({
    role: parsedRole.data,
    message: `${parsedRole.data} route is live`
  });
});

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});
