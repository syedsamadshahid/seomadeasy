import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { getStripe } from "@/lib/stripe/client";
import { priceIdForPlan } from "@/lib/stripe/plans";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/cache/redis";

const bodySchema = z.object({
  plan: z.enum(["pro", "agency"]),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: Request) {
  const user = await getCurrentUser();

  // Rate limit: 5 checkout sessions per user per minute
  const rlKey = `stripe-rl:${user.id}:checkout:${Math.floor(Date.now() / 60_000)}`;
  const rlCount = await redis.incr(rlKey);
  if (rlCount === 1) await redis.expire(rlKey, 65);
  if (rlCount > 5) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { plan } = parsed.data;
  const priceId = priceIdForPlan(plan);
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured for this plan" },
      { status: 500 },
    );
  }

  const stripe = getStripe();

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email });
    // updateMany with null guard: only the first concurrent request writes;
    // subsequent ones lose the race harmlessly. Re-read to get the winning ID.
    await prisma.user.updateMany({
      where: { id: user.id, stripeCustomerId: null },
      data: { stripeCustomerId: customer.id },
    });
    const fresh = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    });
    customerId = fresh?.stripeCustomerId ?? customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/dashboard/billing?status=success`,
    cancel_url: `${APP_URL}/dashboard/billing?status=cancelled`,
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    customer_update: { address: "auto" },
  });

  return NextResponse.json({ url: session.url });
}
