import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { getStripe } from "@/lib/stripe/client";
import { redis } from "@/lib/cache/redis";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST() {
  const user = await getCurrentUser();

  // Rate limit: 5 portal sessions per user per minute
  const rlKey = `stripe-rl:${user.id}:portal:${Math.floor(Date.now() / 60_000)}`;
  const rlCount = await redis.incr(rlKey);
  if (rlCount === 1) await redis.expire(rlKey, 65);
  if (rlCount > 5) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!user.stripeCustomerId) {
    return NextResponse.json(
      { error: "No active subscription to manage" },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${APP_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
