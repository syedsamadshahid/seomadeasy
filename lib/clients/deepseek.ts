import { withCache } from "@/lib/cache";
import { logUsage } from "@/lib/usage";
import { fetchJson } from "@/lib/clients/http";

// TESTING ONLY — DeepSeek is not a production provider for Vantage (US SMB compliance).
// Used as a cheap stand-in for all LLM calls when USE_DEEPSEEK_TEST=true.
// Remove or disable before shipping. See CLAUDE.md override note.

const BASE_URL = "https://api.deepseek.com/v1";
const MODEL = "deepseek-chat";

// DeepSeek pricing: ~$0.14/1M input + $0.28/1M output (cache-hit discount exists)
// Using a conservative blended ~$0.27/1M = 27 cents per million tokens for estimates.
const CENTS_PER_MILLION_TOKENS = 27;

function tokensToCents(inputTokens: number, outputTokens: number): number {
  return Math.ceil(((inputTokens + outputTokens) / 1_000_000) * CENTS_PER_MILLION_TOKENS);
}

function apiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY must be set");
  return key;
}

interface DeepSeekResponse {
  choices: Array<{ message: { content: string | null } }>;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export interface DeepSeekResult {
  text: string;
  citations: string[];
}

export async function deepseekChat(
  prompt: string,
  userId: string,
  auditId: string | undefined,
  cacheKeyStr: string,
  { jsonMode = false }: { jsonMode?: boolean } = {},
): Promise<DeepSeekResult> {
  const effectiveKey = jsonMode ? `${cacheKeyStr}:json` : cacheKeyStr;
  return withCache<DeepSeekResult>(effectiveKey, 24 * 60 * 60, async () => {
    const body: Record<string, unknown> = {
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200,
    };
    if (jsonMode) {
      body.response_format = { type: "json_object" };
    }

    const res = await fetchJson<DeepSeekResponse>(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = res.choices[0]?.message?.content ?? "";
    const inputTokens = res.usage?.prompt_tokens ?? 0;
    const outputTokens = res.usage?.completion_tokens ?? 0;

    await logUsage({
      userId,
      auditId,
      vendor: "deepseek",
      endpoint: "chat/completions",
      units: inputTokens + outputTokens,
      costCents: tokensToCents(inputTokens, outputTokens),
    });

    return { text, citations: [] };
  });
}
