import { cacheKey } from "@/lib/cache";
import { geminiGenerate } from "@/lib/clients/gemini";
import { prisma } from "@/lib/db";
import type { GeoEngine, Sentiment } from "@prisma/client";

export interface ParsedGeoResponse {
  mentioned: boolean;
  cited: boolean;
  prominence: number; // 0–10
  sentiment: Sentiment;
  competitorsNamed: string[];
}

const VALID_SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"];

export async function parseAndStoreGeoRun(
  auditId: string,
  engine: GeoEngine,
  prompt: string,
  response: string,
  citations: string[],
  domain: string,
  userId: string,
): Promise<ParsedGeoResponse> {
  const parsePrompt = `Analyze this AI assistant response for brand visibility of "${domain}".

Search query: ${prompt}
AI Response: ${response}
${citations.length > 0 ? `Citations: ${citations.slice(0, 5).join(", ")}` : ""}

Extract and return ONLY a JSON object with these exact keys:
- "mentioned": boolean — is "${domain}" or its brand name referenced anywhere?
- "cited": boolean — is it cited as a source, linked, or explicitly credited?
- "prominence": integer 0–10 — 0=not mentioned, 1–3=brief, 4–6=moderate, 7–9=prominent, 10=top recommendation
- "sentiment": "positive" | "neutral" | "negative" — tone toward the brand
- "competitorsNamed": string[] — up to 10 other brand names or domains mentioned instead`;

  const key = cacheKey("gemini", "geo-parse", {
    response: response.slice(0, 300),
    domain,
    engine,
  });

  const raw = await geminiGenerate(parsePrompt, userId, auditId, {
    cacheKey: key,
    ttlSeconds: 7 * 24 * 60 * 60,
    jsonMode: true,
  });

  let parsed: ParsedGeoResponse;
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    parsed = {
      mentioned: Boolean(obj.mentioned),
      cited: Boolean(obj.cited),
      prominence: Math.min(10, Math.max(0, Math.round(Number(obj.prominence ?? 0)))),
      sentiment: (VALID_SENTIMENTS.includes(obj.sentiment as Sentiment)
        ? (obj.sentiment as Sentiment)
        : "neutral"),
      competitorsNamed: Array.isArray(obj.competitorsNamed)
        ? (obj.competitorsNamed as string[]).slice(0, 10)
        : [],
    };
  } catch {
    parsed = { mentioned: false, cited: false, prominence: 0, sentiment: "neutral", competitorsNamed: [] };
  }

  await prisma.geoRun.create({
    data: {
      auditId,
      engine,
      prompt,
      mentioned: parsed.mentioned,
      cited: parsed.cited,
      prominence: parsed.prominence,
      sentiment: parsed.sentiment,
      competitorsNamed: parsed.competitorsNamed,
      engineVersion: "v1",
    },
  });

  return parsed;
}
