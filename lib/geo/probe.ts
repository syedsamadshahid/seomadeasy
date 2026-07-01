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
  // The AI's answer to a prompt does not depend on which domain we're measuring
  // (prompts never name the domain), so cache by (engine, prompt) only. This lets
  // competitor audits that reuse the same shared prompts hit the cache for free.
  const key = cacheKey("geo", `probe-${engine}`, { prompt });

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
