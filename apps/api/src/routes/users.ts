import { Router } from "express";
import { ZodError } from "zod";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import {
  getUserById,
  getUserLocation,
  updateUserProfile,
  upsertUserLocation
} from "../db/users";
import { updateUserLocationSchema, updateUserProfileSchema } from "../schemas";

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole("user"));
usersRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

usersRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const [user, location] = await Promise.all([getUserById(userId), getUserLocation(userId)]);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({
    user,
    location,
    isProfileComplete: Boolean(user.name && location)
  });
});

usersRouter.patch("/me/profile", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = updateUserProfileSchema.parse(req.body);
    const user = await updateUserProfile({
      userId,
      name: payload.name,
      email: payload.email ?? null
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }

    return res.status(500).json({ message: "Failed to update profile" });
  }
});

usersRouter.put("/me/location", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = updateUserLocationSchema.parse(req.body);
    const location = await upsertUserLocation({
      userId,
      lat: payload.lat,
      lng: payload.lng,
      accuracyM: payload.accuracyM,
      address: payload.address
    });

    return res.json({ location });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }

    return res.status(500).json({ message: "Failed to update location" });
  }
});
