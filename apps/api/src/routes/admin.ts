import { Router } from "express";
import { ZodError } from "zod";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import {
  getRestaurantById,
  listRestaurantApplications,
  reviewRestaurantApplication
} from "../db/restaurants";
import { listApplicationsQuerySchema, reviewApplicationSchema } from "../schemas";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));
adminRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

adminRouter.get("/applications", async (req, res) => {
  try {
    const query = listApplicationsQuerySchema.parse(req.query);
    const applications = await listRestaurantApplications(query.status);
    return res.json({ applications });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid query", issues: error.issues });
    }
    return res.status(500).json({ message: "Failed to list applications" });
  }
});

adminRouter.post(
  "/applications/:restaurantId/approve",
  async (req: AuthenticatedRequest, res) => {
    const restaurantId = req.params.restaurantId;
    const existing = await getRestaurantById(restaurantId);
    if (!existing) {
      return res.status(404).json({ message: "Application not found" });
    }
    if (existing.status !== "pending") {
      return res.status(409).json({ message: "Only pending applications can be approved." });
    }

    const restaurant = await reviewRestaurantApplication({
      restaurantId,
      status: "approved"
    });

    if (!restaurant) {
      return res.status(409).json({ message: "Application is no longer pending." });
    }

    return res.json({ restaurant });
  }
);

adminRouter.post(
  "/applications/:restaurantId/reject",
  async (req: AuthenticatedRequest, res) => {
    try {
      const restaurantId = req.params.restaurantId;
      const existing = await getRestaurantById(restaurantId);
      if (!existing) {
        return res.status(404).json({ message: "Application not found" });
      }
      if (existing.status !== "pending") {
        return res.status(409).json({ message: "Only pending applications can be rejected." });
      }

      const payload = reviewApplicationSchema.parse(req.body);
      const restaurant = await reviewRestaurantApplication({
        restaurantId,
        status: "rejected",
        reason: payload.reason
      });

      if (!restaurant) {
        return res.status(409).json({ message: "Application is no longer pending." });
      }

      return res.json({ restaurant });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid payload", issues: error.issues });
      }
      return res.status(500).json({ message: "Failed to reject application" });
    }
  }
);
