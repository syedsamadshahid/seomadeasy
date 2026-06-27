import { cacheKey } from "@/lib/cache";
import { chatGpt } from "@/lib/clients/openai";
import { perplexitySonar } from "@/lib/clients/perplexity";
import { geminiGenerate } from "@/lib/clients/gemini";
import { aiOverview } from "@/lib/clients/dataforseo";
import type { GeoEngine, Plan } from "@prisma/client";

export interface ProbeResult {
  engine: GeoEngine;
  prompt: string;
  response: string;
  citations: string[];
}

const ENGINE_SETS: Record<Plan, GeoEngine[]> = {
  free: ["gemini"],
  pro: ["chatgpt", "perplexity", "gemini"],
  agency: ["chatgpt", "perplexity", "gemini", "google_aio"],
};

export function enginesForPlan(plan: Plan): GeoEngine[] {
  return ENGINE_SETS[plan];
}

export async function probeEngine(
  engine: GeoEngine,
  prompt: string,
  domain: string,
  userId: string,
  auditId: string,
): Promise<ProbeResult> {
  const key = cacheKey("geo", `probe-${engine}`, { prompt, domain });

  switch (engine) {
    case "chatgpt": {
      const r = await chatGpt(prompt, userId, auditId, key);
      return { engine, prompt, response: r.text, citations: r.citations };
    }
    case "perplexity": {
      const r = await perplexitySonar(prompt, userId, auditId, key);
      return { engine, prompt, response: r.text, citations: r.citations };
    }
    case "gemini": {
      const text = await geminiGenerate(prompt, userId, auditId, {
        cacheKey: key,
        ttlSeconds: 24 * 60 * 60,
        jsonMode: false,
      });
      return { engine, prompt, response: text, citations: [] };
    }
    case "google_aio": {
      const text = await aiOverview(prompt, userId, auditId);
      return { engine, prompt, response: text, citations: [] };
    }
  }
}
