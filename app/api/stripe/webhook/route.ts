import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { planForPriceId } from "@/lib/stripe/plans";
import { prisma } from "@/lib/db";

// Raw body required for Stripe signature verification
export const runtime = "nodejs";

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const plan = priceId ? planForPriceId(priceId) : null;
  const resolvedPlan = plan ?? "free";

  const periodEnd = subscription.items.data[0]?.current_period_end ?? null;
  const renewsAt =
    subscription.status === "active" && periodEnd
      ? new Date(periodEnd * 1000)
      : null;

  await prisma.user.update({
    where: { stripeCustomerId: customerId },
    data: {
      plan: resolvedPlan,
      stripeSubscriptionId: subscription.id,
      planRenewsAt: renewsAt,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  await prisma.user.update({
    where: { stripeCustomerId: customerId },
    data: {
      plan: "free",
      stripeSubscriptionId: null,
      planRenewsAt: null,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const subscription =
            await getStripe().subscriptions.retrieve(subscriptionId);
          await handleSubscriptionChange(subscription);
        }
        break;
      }
      case "customer.subscription.updated": {
        await handleSubscriptionChange(
          event.data.object as Stripe.Subscription,
        );
        break;
      }
      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      }
    }
  } catch (err) {
    console.error("[stripe/webhook] handler error", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
