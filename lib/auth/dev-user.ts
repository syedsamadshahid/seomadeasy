import type { Plan } from "@prisma/client";

// Hardcoded dev user used until real auth lands in Phase 7. `getCurrentUser`
// is the single chokepoint to swap for a Firebase session lookup later — it is
// already async so callers won't change shape. The matching DB row is created
// by prisma/seed.ts.

export type DevUser = {
  id: string;
  email: string;
  plan: Plan;
};

export const DEV_USER: DevUser = {
  id: process.env.DEV_USER_ID ?? "dev-user",
  email: "dev@vantage.local",
  plan: "agency",
};

export async function getCurrentUser(): Promise<DevUser> {
  return DEV_USER;
}
