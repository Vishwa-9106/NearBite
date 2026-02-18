"use client";

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, initializeAuth, inMemoryPersistence, type Auth } from "firebase/auth";

function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  const missing = [
    ["NEXT_PUBLIC_FIREBASE_API_KEY", apiKey],
    ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", authDomain],
    ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", projectId],
    ["NEXT_PUBLIC_FIREBASE_APP_ID", appId]
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Firebase env keys: ${missing.join(", ")}`);
  }

  return {
    apiKey: apiKey as string,
    authDomain: authDomain as string,
    projectId: projectId as string,
    appId: appId as string,
    messagingSenderId,
    storageBucket
  };
}

let authInstance: Auth | null = null;

export function getFirebaseApp() {
  return getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
}

export function getFirebaseAuth() {
  if (authInstance) {
    return authInstance;
  }

  const app = getFirebaseApp();
  try {
    authInstance = initializeAuth(app, {
      persistence: inMemoryPersistence
    });
  } catch {
    authInstance = getAuth(app);
  }

  return authInstance;
}
