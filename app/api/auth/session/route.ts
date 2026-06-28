import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuth } from "@/lib/auth/firebase-admin";
import { prisma } from "@/lib/db";

const SESSION_EXPIRY_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

const PostBody = z.object({ idToken: z.string().min(1) });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = PostBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { idToken } = parsed.data;

  let decoded: { uid: string; email?: string };
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
  }

  await prisma.user.upsert({
    where: { firebaseUid: decoded.uid },
    update: {},
    create: {
      firebaseUid: decoded.uid,
      email: decoded.email ?? "",
      plan: "free",
    },
  });

  let sessionCookie: string;
  try {
    sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRY_MS,
    });
  } catch {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("__session", sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRY_MS / 1000,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("__session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
