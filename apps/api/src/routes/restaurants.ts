import { Router } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import {
  getRestaurantById,
  hasRestaurantLocation,
  hasRestaurantProfile,
  submitRestaurantApplication,
  updateRestaurantLocation,
  updateRestaurantProfile
} from "../db/restaurants";
import { updateRestaurantLocationSchema, updateRestaurantProfileSchema } from "../schemas";
import { uploadRestaurantDocument } from "../services/restaurant-documents";

export const restaurantsRouter = Router();
const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_DOCUMENT_SIZE_BYTES
  }
});
const ALLOWED_DOCUMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
]);

restaurantsRouter.use(requireAuth, requireRole("restaurant"));
restaurantsRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

restaurantsRouter.post("/me/document", (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Document must be 5MB or smaller." });
    }

    if (error) {
      return res.status(400).json({ message: "Invalid document upload request." });
    }

    return next();
  });
}, async (req: AuthenticatedRequest, res) => {
  const restaurantId = req.auth?.userId;
  if (!restaurantId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const uploadedFile = req.file;
  if (!uploadedFile) {
    return res.status(400).json({ message: "Document file is required." });
  }

  if (!ALLOWED_DOCUMENT_TYPES.has(uploadedFile.mimetype)) {
    return res.status(400).json({
      message: "Only JPG, PNG, WEBP, or PDF files are allowed."
    });
  }

  try {
    const uploaded = await uploadRestaurantDocument({
      restaurantId,
      fileBuffer: uploadedFile.buffer,
      contentType: uploadedFile.mimetype,
      originalName: uploadedFile.originalname
    });

    return res.json({
      url: uploaded.downloadUrl,
      path: uploaded.objectPath
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";
    const normalizedMessage = errorMessage.toLowerCase();

    if (normalizedMessage.includes("no such bucket") || normalizedMessage.includes("bucket does not exist")) {
      return res.status(500).json({
        message:
          "Document storage bucket not found. Check FIREBASE_STORAGE_BUCKET (commonly <project-id>.appspot.com)."
      });
    }

    if (normalizedMessage.includes("permission") || normalizedMessage.includes("storage.objects.create")) {
      return res.status(500).json({
        message: "Document upload permission denied for Firebase service account."
      });
    }

    return res.status(500).json({
      message: errorMessage || "Failed to upload document."
    });
  }
});

restaurantsRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  const restaurantId = req.auth?.userId;
  if (!restaurantId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const restaurant = await getRestaurantById(restaurantId);
  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found" });
  }

  return res.json({
    restaurant,
    isProfileComplete: hasRestaurantProfile(restaurant),
    isLocationSet: hasRestaurantLocation(restaurant)
  });
});

restaurantsRouter.patch("/me/profile", async (req: AuthenticatedRequest, res) => {
  try {
    const restaurantId = req.auth?.userId;
    if (!restaurantId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = updateRestaurantProfileSchema.parse(req.body);
    const restaurant = await updateRestaurantProfile({
      restaurantId,
      ownerName: payload.ownerName,
      hotelName: payload.hotelName,
      fssaiNumber: payload.fssaiNumber,
      photoUrl: payload.photoUrl
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    return res.json({ restaurant });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }

    return res.status(500).json({ message: "Failed to update restaurant profile" });
  }
});

restaurantsRouter.put("/me/location", async (req: AuthenticatedRequest, res) => {
  try {
    const restaurantId = req.auth?.userId;
    if (!restaurantId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = updateRestaurantLocationSchema.parse(req.body);
    const restaurant = await updateRestaurantLocation({
      restaurantId,
      lat: payload.lat,
      lng: payload.lng,
      address: payload.address
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    return res.json({ restaurant });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }

    return res.status(500).json({ message: "Failed to update restaurant location" });
  }
});

restaurantsRouter.post("/me/application/submit", async (req: AuthenticatedRequest, res) => {
  const restaurantId = req.auth?.userId;
  if (!restaurantId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const current = await getRestaurantById(restaurantId);
  if (!current) {
    return res.status(404).json({ message: "Restaurant not found" });
  }

  if (!hasRestaurantProfile(current) || !hasRestaurantLocation(current)) {
    return res.status(400).json({
      message: "Complete profile and location before submitting application."
    });
  }

  if (current.status === "approved") {
    return res.status(400).json({ message: "Restaurant is already approved." });
  }

  if (current.status === "pending") {
    return res.status(409).json({ message: "Application is already under review." });
  }

  const restaurant = await submitRestaurantApplication(restaurantId);
  if (!restaurant) {
    return res.status(409).json({ message: "Application cannot be submitted in current state." });
  }

  return res.json({ restaurant });
});

restaurantsRouter.get("/me/application", async (req: AuthenticatedRequest, res) => {
  const restaurantId = req.auth?.userId;
  if (!restaurantId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const restaurant = await getRestaurantById(restaurantId);
  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found" });
  }

  return res.json({
    status: restaurant.status,
    reason: restaurant.review_reason,
    submittedAt: restaurant.application_submitted_at,
    reviewedAt: restaurant.application_reviewed_at
  });
});
