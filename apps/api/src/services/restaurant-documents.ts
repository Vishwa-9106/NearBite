import crypto from "node:crypto";
import path from "node:path";
import { getFirebaseStorageBucket } from "./firebase";

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf"
};

function normalizeExtension(contentType: string, originalName: string) {
  const byMime = EXTENSION_BY_CONTENT_TYPE[contentType];
  if (byMime) {
    return byMime;
  }

  const fromName = path.extname(originalName).replace(".", "").toLowerCase();
  return fromName || "bin";
}

export async function uploadRestaurantDocument(params: {
  restaurantId: string;
  fileBuffer: Buffer;
  contentType: string;
  originalName: string;
}) {
  const bucket = getFirebaseStorageBucket();
  const extension = normalizeExtension(params.contentType, params.originalName);
  const objectName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const objectPath = `restaurant-documents/${params.restaurantId}/${objectName}`;
  const downloadToken = crypto.randomUUID();
  const file = bucket.file(objectPath);

  await file.save(params.fileBuffer, {
    resumable: false,
    metadata: {
      contentType: params.contentType,
      metadata: {
        firebaseStorageDownloadTokens: downloadToken
      }
    }
  });

  return {
    objectPath,
    downloadUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      objectPath
    )}?alt=media&token=${downloadToken}`
  };
}
