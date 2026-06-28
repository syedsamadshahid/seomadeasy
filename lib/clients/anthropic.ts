import { withCache } from "@/lib/cache";
import { logUsage } from "@/lib/usage";
import { fetchJson } from "@/lib/clients/http";
import { isLlmTestMode } from "@/lib/clients/llm-test-mode";
import { deepseekChat } from "@/lib/clients/deepseek";
import { withRateLimit } from "@/lib/clients/ratelimit";

const BASE_URL = "https://api.anthropic.com/v1";
const MODEL = "claude-sonnet-4-6";

// Claude Sonnet 4.6 pricing: $3/1M input + $15/1M output
function tokensToCents(inputTokens: number, outputTokens: number): number {
  const input = Math.ceil((inputTokens / 1_000_000) * 300);
  const output = Math.ceil((outputTokens / 1_000_000) * 1500);
  return input + output;
}

function apiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY must be set");
  return key;
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
  usage?: { input_tokens: number; output_tokens: number };
}

export async function claudeGenerate(
  prompt: string,
  userId: string,
  auditId: string | undefined,
  cacheKeyStr: string,
  ttlSeconds = 7 * 24 * 60 * 60,
): Promise<string> {
  if (isLlmTestMode()) {
    return (await deepseekChat(prompt, userId, auditId, cacheKeyStr)).text;
  }

  return withCache<string>(cacheKeyStr, ttlSeconds, async () => {
    return withRateLimit("anthropic", async () => {
      const res = await fetchJson<AnthropicResponse>(`${BASE_URL}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey(),
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const text = res.content.find((c) => c.type === "text")?.text ?? "";
      const inputTokens = res.usage?.input_tokens ?? 0;
      const outputTokens = res.usage?.output_tokens ?? 0;

      await logUsage({
        userId,
        auditId,
        vendor: "anthropic",
        endpoint: "messages",
        units: inputTokens + outputTokens,
        costCents: tokensToCents(inputTokens, outputTokens),
      });

      return text;
    });
  });
}
