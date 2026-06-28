import { withCache } from "@/lib/cache";
import { logUsage } from "@/lib/usage";
import { fetchJson } from "@/lib/clients/http";
import { isLlmTestMode } from "@/lib/clients/llm-test-mode";
import { deepseekChat } from "@/lib/clients/deepseek";
import { withRateLimit } from "@/lib/clients/ratelimit";

const BASE_URL = "https://api.openai.com/v1";
const MODEL = "gpt-4o-mini";

// GPT-4o mini pricing: $0.15/1M input + $0.60/1M output
function tokensToCents(inputTokens: number, outputTokens: number): number {
  const input = Math.ceil((inputTokens / 1_000_000) * 15);
  const output = Math.ceil((outputTokens / 1_000_000) * 60);
  return input + output;
}

function apiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY must be set");
  return key;
}

interface OpenAIResponse {
  choices: Array<{ message: { content: string | null } }>;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export interface ChatResult {
  text: string;
  citations: string[];
}

export async function chatGpt(
  prompt: string,
  userId: string,
  auditId: string | undefined,
  cacheKeyStr: string,
): Promise<ChatResult> {
  if (isLlmTestMode()) {
    return deepseekChat(prompt, userId, auditId, cacheKeyStr);
  }

  return withCache<ChatResult>(cacheKeyStr, 24 * 60 * 60, async () => {
    return withRateLimit("openai", async () => {
      const res = await fetchJson<OpenAIResponse>(`${BASE_URL}/chat/completions`, {
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
      const inputTokens = res.usage?.prompt_tokens ?? 0;
      const outputTokens = res.usage?.completion_tokens ?? 0;

      await logUsage({
        userId,
        auditId,
        vendor: "openai",
        endpoint: "chat/completions",
        units: inputTokens + outputTokens,
        costCents: tokensToCents(inputTokens, outputTokens),
      });

      return { text, citations: [] };
    });
  });
}
