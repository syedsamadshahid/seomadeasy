import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/db";
import { decryptToken } from "@/lib/crypto/tokens";
import { cacheKey, withCache } from "@/lib/cache";
import { logUsage } from "@/lib/usage";

const TTL_SECONDS = 24 * 60 * 60; // 24 hours

export interface SearchAnalyticsRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchAnalyticsResult {
  rows: SearchAnalyticsRow[];
  totalClicks: number;
  totalImpressions: number;
}

interface GscApiResponse {
  rows?: Array<{
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

async function getAccessToken(userId: string): Promise<string | null> {
  const connection = await prisma.googleConnection.findFirst({ where: { userId } });
  if (!connection) return null;

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const refreshToken = decryptToken(connection.encryptedRefreshToken);
  const oauth2Client = new OAuth2Client(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { token } = await oauth2Client.getAccessToken();
  return token ?? null;
}

export async function fetchSearchAnalytics(
  userId: string,
  siteUrl: string,
  auditId?: string,
  startDate = "2024-01-01",
  endDate = new Date().toISOString().slice(0, 10),
): Promise<SearchAnalyticsResult | null> {
  const key = cacheKey("gsc", "searchAnalytics", { userId, siteUrl, startDate, endDate });

  return withCache(key, TTL_SECONDS, async () => {
    const accessToken = await getAccessToken(userId);
    if (!accessToken) return null;

    const body = JSON.stringify({
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: 100,
    });

    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body,
      },
    );

    if (!res.ok) return null;

    const data = (await res.json()) as GscApiResponse;

    await logUsage({
      userId,
      auditId,
      vendor: "gsc",
      endpoint: "searchAnalytics",
      units: 1,
      costCents: 0,
    });

    const rows: SearchAnalyticsRow[] = (data.rows ?? []).map((r) => ({
      query: r.keys[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }));

    return {
      rows,
      totalClicks: rows.reduce((sum, r) => sum + r.clicks, 0),
      totalImpressions: rows.reduce((sum, r) => sum + r.impressions, 0),
    };
  });
}

export async function hasGscConnection(userId: string): Promise<boolean> {
  const connection = await prisma.googleConnection.findFirst({ where: { userId } });
  return connection !== null;
}
