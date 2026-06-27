import { cacheKey, withCache } from "@/lib/cache";
import { logUsage } from "@/lib/usage";
import { fetchJson } from "@/lib/clients/http";
import { isLlmTestMode } from "@/lib/clients/llm-test-mode";
import { deepseekChat } from "@/lib/clients/deepseek";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "gemini-2.0-flash";

// Gemini Flash 2.0 pricing: ~$0.075/1M input + $0.30/1M output
// Blended approx $0.15/1M = 15 cents per million tokens
const CENTS_PER_MILLION_TOKENS = 15;

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY must be set");
  return key;
}

interface GeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text: string }> };
  }>;
  usageMetadata?: {
    totalTokenCount?: number;
  };
}

async function callGemini(
  prompt: string,
  systemInstruction?: string,
  jsonMode = true,
  model = MODEL,
): Promise<{ text: string; tokens: number }> {
  const url = `${BASE_URL}/models/${model}:generateContent?key=${apiKey()}`;

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: jsonMode
      ? { responseMimeType: "application/json" }
      : { maxOutputTokens: 1200 },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetchJson<GeminiResponse>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = res.candidates[0]?.content?.parts[0]?.text ?? "";
  const tokens = res.usageMetadata?.totalTokenCount ?? 0;
  return { text, tokens };
}

function tokensToCents(tokens: number): number {
  return Math.ceil((tokens / 1_000_000) * CENTS_PER_MILLION_TOKENS);
}

export async function geminiGenerate(
  prompt: string,
  userId: string,
  auditId: string | undefined,
  options: {
    cacheKey?: string;
    ttlSeconds?: number;
    systemInstruction?: string;
    jsonMode?: boolean;
    model?: string;
  } = {},
): Promise<string> {
  const key = options.cacheKey ?? cacheKey("gemini", "generate", { prompt });
  const ttl = options.ttlSeconds ?? 24 * 60 * 60;
  const jsonMode = options.jsonMode ?? true;
  const model = options.model ?? MODEL;

  if (isLlmTestMode()) {
    return (await deepseekChat(prompt, userId, auditId, key, { jsonMode })).text;
  }

  return withCache<string>(key, ttl, async () => {
    const { text, tokens } = await callGemini(prompt, options.systemInstruction, jsonMode, model);
    await logUsage({
      userId,
      auditId,
      vendor: "gemini",
      endpoint: "generateContent",
      units: tokens,
      costCents: tokensToCents(tokens),
    });
    return text;
  });
}
