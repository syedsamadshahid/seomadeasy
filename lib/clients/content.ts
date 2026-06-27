import { cacheKey } from "@/lib/cache";
import { geminiGenerate } from "@/lib/clients/gemini";
import { claudeGenerate } from "@/lib/clients/anthropic";
import type { Plan } from "@prisma/client";

// Model routing per CLAUDE.md:
//   Agency → Claude Sonnet 4.6  (premium quality)
//   Pro    → Gemini Pro 2.0     (cost/quality balance)
//   Free   → Gemini Flash 2.0   (limited output)

const GEMINI_PRO = "gemini-2.0-pro-exp";

export async function generateContent(
  prompt: string,
  plan: Plan,
  userId: string,
  auditId: string,
  cacheKeySuffix: string,
): Promise<string> {
  const key = cacheKey("content", plan, { p: prompt.slice(0, 300), s: cacheKeySuffix });
  const ttl = 7 * 24 * 60 * 60;

  if (plan === "agency") {
    return claudeGenerate(prompt, userId, auditId, key, ttl);
  }

  return geminiGenerate(prompt, userId, auditId, {
    cacheKey: key,
    ttlSeconds: ttl,
    jsonMode: false,
    model: plan === "pro" ? GEMINI_PRO : undefined,
  });
}
