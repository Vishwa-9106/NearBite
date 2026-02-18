import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { sql } from "./clients/neon";
import { redis } from "./clients/redis";
import { env } from "./env";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { restaurantsRouter } from "./routes/restaurants";
import { mapsRouter } from "./routes/maps";
import { adminRouter } from "./routes/admin";

const app = express();

const allowedOrigins = env.FRONTEND_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    return next();
  }

  return res.status(403).json({ message: "Untrusted request origin" });
});

app.get("/", (_req, res) => {
  res.json({
    service: "nearbite-api",
    status: "ok",
    environment: env.NODE_ENV
  });
});

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

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/restaurants", restaurantsRouter);
app.use("/maps", mapsRouter);
app.use("/admin", adminRouter);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});
