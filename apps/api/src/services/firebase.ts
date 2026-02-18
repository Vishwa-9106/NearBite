import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import type { ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { env } from "../env";

type ServiceAccountInput = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function parseServiceAccount(raw: string): ServiceAccount {
  let parsed: ServiceAccountInput;

  try {
    parsed = JSON.parse(raw) as ServiceAccountInput;
  } catch {
    throw new Error("Invalid Firebase service account JSON format.");
  }

  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error("Invalid Firebase service account JSON.");
  }

  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key.replace(/\\n/g, "\n")
  };
}

function getFirebaseAdminApp() {
  if (getApps().length === 0) {
    const serviceAccount = parseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    const storageBucket =
      env.FIREBASE_STORAGE_BUCKET || `${env.FIREBASE_PROJECT_ID}.firebasestorage.app`;
    initializeApp({
      credential: cert(serviceAccount),
      projectId: env.FIREBASE_PROJECT_ID,
      storageBucket
    });
  }

  return getApp();
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseStorageBucket() {
  const app = getFirebaseAdminApp();
  const storage = getStorage(app);
  const bucketName = env.FIREBASE_STORAGE_BUCKET || `${env.FIREBASE_PROJECT_ID}.firebasestorage.app`;
  return storage.bucket(bucketName);
}
