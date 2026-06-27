import "server-only";
import type { Plan } from "@prisma/client";

export function priceIdForPlan(plan: Plan): string | null {
  switch (plan) {
    case "pro":
      return process.env.STRIPE_PRICE_PRO ?? null;
    case "agency":
      return process.env.STRIPE_PRICE_AGENCY ?? null;
    default:
      return null;
  }
}

export function planForPriceId(priceId: string): Plan | null {
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_AGENCY) return "agency";
  return null;
}
