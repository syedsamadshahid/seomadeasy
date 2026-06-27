import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAdminAuth } from "./firebase-admin";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

// Fallback used when Firebase env vars are not configured (local dev without credentials).
const DEV_FALLBACK: User = {
  id: process.env.DEV_USER_ID ?? "dev-user",
  firebaseUid: null,
  email: "dev@vantage.local",
  plan: "agency",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  planRenewsAt: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

function isFirebaseConfigured() {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

export async function getCurrentUser(): Promise<User> {
  if (!isFirebaseConfigured()) {
    return DEV_FALLBACK;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;
  if (!session) redirect("/login");

  let decoded: { uid: string };
  try {
    decoded = await getAdminAuth().verifySessionCookie(session, true);
  } catch {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });
  if (!user) redirect("/login");

  return user;
}
