import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { costByVendor, costByDay, topAuditsByCost, auditsOverCeiling } from "@/lib/usage/aggregates";
import { getCacheStats } from "@/lib/cache/metrics";

export async function GET() {
  await getCurrentUser();

  const [vendors, daily, topAudits, overCeiling, cacheStats] = await Promise.all([
    costByVendor(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    costByDay(),
    topAuditsByCost(10),
    auditsOverCeiling(),
    getCacheStats(),
  ]);

  const totalCents = vendors.reduce((sum, v) => sum + v.totalCents, 0);

  return NextResponse.json({ totalCents, vendors, daily, topAudits, overCeiling, cacheStats });
}
