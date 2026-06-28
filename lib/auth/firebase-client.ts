"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

export function isFirebaseConfiguredClient(): boolean {
  return !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
}

export function getClientAuth(): Auth {
  if (!isFirebaseConfiguredClient()) {
    throw new Error("Firebase is not configured. Enable dev bypass or configure credentials in .env.");
  }

  if (_auth) return _auth;

  if (!_app) {
    _app = getApps().length
      ? getApps()[0]
      : initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        });
  }

  _auth = getAuth(_app);
  return _auth;
}
