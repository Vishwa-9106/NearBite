import { Router } from "express";
import { ZodError } from "zod";
import { redis } from "../clients/redis";
import { env } from "../env";
import { requireAuth } from "../middleware/auth";
import { reverseGeocodeQuerySchema } from "../schemas";

type GeocodeApiResponse = {
  results?: Array<{ formatted_address?: string }>;
  status?: string;
};

export const mapsRouter = Router();

mapsRouter.use(requireAuth);
mapsRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

mapsRouter.get("/reverse-geocode", async (req, res) => {
  try {
    const query = reverseGeocodeQuerySchema.parse(req.query);
    const lat = Number(query.lat.toFixed(6));
    const lng = Number(query.lng.toFixed(6));
    const cacheKey = `maps:reverse_geocode:${lat}:${lng}`;

    const cached = await redis.get<string>(cacheKey);
    if (cached) {
      return res.json({ address: cached, source: "cache" });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${lat},${lng}`);
    url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      return res.status(502).json({ message: "Geocoding provider error" });
    }

    const payload = (await response.json()) as GeocodeApiResponse;
    const address = payload.results?.[0]?.formatted_address ?? null;

    if (!address) {
      return res.status(404).json({
        message: "Address not found for these coordinates",
        providerStatus: payload.status ?? "UNKNOWN"
      });
    }

    await redis.set(cacheKey, address, { ex: 60 * 60 * 24 });
    return res.json({ address, source: "provider" });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid coordinates", issues: error.issues });
    }

    return res.status(500).json({ message: "Failed to reverse geocode coordinates" });
  }
});
