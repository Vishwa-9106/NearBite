import crypto from "node:crypto";
import path from "node:path";
import { getFirebaseStorage, getFirebaseStorageBucketNames } from "./firebase";

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
  const storage = getFirebaseStorage();
  const bucketNames = getFirebaseStorageBucketNames();
  const extension = normalizeExtension(params.contentType, params.originalName);
  let lastError: unknown;

  for (const bucketName of bucketNames) {
    const bucket = storage.bucket(bucketName);
    const objectName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const objectPath = `restaurant-documents/${params.restaurantId}/${objectName}`;
    const downloadToken = crypto.randomUUID();
    const file = bucket.file(objectPath);

    try {
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
    } catch (error) {
      lastError = error;
      if (bucketNames.length === 1) {
        break;
      }
    }
  }

  if (lastError instanceof Error) {
    throw new Error(`Storage upload failed: ${lastError.message}`);
  }

  throw new Error("Storage upload failed.");
}
