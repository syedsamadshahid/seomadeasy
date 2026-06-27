import { withCache } from "@/lib/cache";
import { logUsage } from "@/lib/usage";
import { fetchJson } from "@/lib/clients/http";
import { isLlmTestMode } from "@/lib/clients/llm-test-mode";
import { deepseekChat } from "@/lib/clients/deepseek";

const BASE_URL = "https://api.perplexity.ai";
// Base Sonar — not Sonar Pro (cost optimization per CLAUDE.md)
const MODEL = "sonar";

// Perplexity Sonar pricing: $1/1M input + $1/1M output + $5/1000 requests
// Per-request fee ($0.005) is the main cost driver
function tokensToCents(tokens: number): number {
  const tokenCost = Math.ceil((tokens / 1_000_000) * 200); // $2/1M blended
  const requestCost = 1; // $0.005 = ~1 cent rounded up
  return tokenCost + requestCost;
}

function apiKey(): string {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) throw new Error("PERPLEXITY_API_KEY must be set");
  return key;
}

interface PerplexityResponse {
  choices: Array<{ message: { content: string | null } }>;
  citations?: string[];
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export interface PerplexityResult {
  text: string;
  citations: string[];
}

export async function perplexitySonar(
  prompt: string,
  userId: string,
  auditId: string | undefined,
  cacheKeyStr: string,
): Promise<PerplexityResult> {
  if (isLlmTestMode()) {
    return deepseekChat(prompt, userId, auditId, cacheKeyStr);
  }

  return withCache<PerplexityResult>(cacheKeyStr, 24 * 60 * 60, async () => {
    const res = await fetchJson<PerplexityResponse>(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1200,
      }),
    });

    const text = res.choices[0]?.message?.content ?? "";
    const citations = res.citations ?? [];
    const tokens =
      (res.usage?.prompt_tokens ?? 0) + (res.usage?.completion_tokens ?? 0);

    await logUsage({
      userId,
      auditId,
      vendor: "perplexity",
      endpoint: "chat/completions",
      units: tokens,
      costCents: tokensToCents(tokens),
    });

    return { text, citations };
  });
}
