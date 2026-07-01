import { Prisma } from "@prisma/client";
import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateGeoPrompts } from "@/lib/geo/prompts";
import { probeEngine, enginesForPlan } from "@/lib/geo/probe";
import { parseAndStoreGeoRun } from "@/lib/geo/parse";
import { computeGeoScore, topCompetitors } from "@/lib/geo/score";

function toJson(v: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
}

export interface RunGeoParams {
  auditId: string;
  domain: string;
  plan: Plan;
  userId: string;
  keywords: string[];
  // When provided (comparison audits), reuse this shared prompt set instead of
  // generating new prompts — keeps the head-to-head apples-to-apples.
  prompts?: string[];
}

export interface RunGeoResult {
  geoScore: number;
}

export async function runGeoForAudit({
  auditId,
  domain,
  plan,
  userId,
  keywords,
  prompts: sharedPrompts,
}: RunGeoParams): Promise<RunGeoResult> {
  const prompts =
    sharedPrompts && sharedPrompts.length > 0
      ? sharedPrompts
      : await generateGeoPrompts(domain, keywords, plan, userId, auditId);

  const engines = enginesForPlan(plan);

  const probeResults = await Promise.all(
    prompts.flatMap((prompt) =>
      engines.map((engine) =>
        probeEngine(engine, prompt, domain, userId, auditId).catch(() => null),
      ),
    ),
  );

  await Promise.all(
    probeResults
      .filter((r): r is NonNullable<typeof r> => r !== null && r.response.length > 0)
      .map((r) =>
        parseAndStoreGeoRun(auditId, r.engine, r.prompt, r.response, r.citations, domain, userId),
      ),
  );

  const geoScore = await computeGeoScore(auditId);
  const competitors = await topCompetitors(auditId);
  const payload = toJson({ score: geoScore, competitors, enginesProbed: engines });

  await prisma.auditResult.upsert({
    where: { auditId_category: { auditId, category: "geo" } },
    create: { auditId, category: "geo", score: geoScore, payload },
    update: { score: geoScore, payload },
  });

  return { geoScore };
}
