import { NonRetriableError } from "inngest";
import { Prisma } from "@prisma/client";
import { inngest, auditRequested } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { rankedPages, onPage, backlinks, domainRank, keywordData } from "@/lib/clients/dataforseo";
import { checkBrokenLinks } from "@/lib/audit/links";
import { fetchPageSpeed } from "@/lib/clients/pagespeed";
import { assertUnderCeiling, pageCapForPlan } from "@/lib/audit/cost";
import { HttpError } from "@/lib/clients/http";
import { runGeoForAudit } from "@/lib/geo/run";
import { generateFixList } from "@/lib/content/fixes";
import { generateRewrites } from "@/lib/content/rewrites";
import { generateGeoBrief } from "@/lib/content/geo-brief";
import { generateContentGaps } from "@/lib/content/gaps";

// JSON-serialize a value so Prisma's InputJsonValue type check passes
function toJson(v: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
}

export const runAudit = inngest.createFunction(
  { id: "run-audit", retries: 2, triggers: [{ event: auditRequested }] },
  async ({ event, step }) => {
    const { auditId } = event.data;

    const audit = await step.run("load-audit", async () => {
      const a = await prisma.audit.findUnique({
        where: { id: auditId },
        include: { project: { include: { user: true } } },
      });
      if (!a) throw new NonRetriableError(`Audit ${auditId} not found`);
      return a;
    });

    const userId = audit.project.user.id;
    const domain = audit.project.domain;
    const plan = audit.project.user.plan;
    const pageCap = pageCapForPlan(plan);

    await step.run("mark-running", async () => {
      await prisma.audit.update({
        where: { id: auditId },
        data: { status: "running", startedAt: new Date() },
      });
    });

    try {
      // ── Step 1: Resolve top pages ──────────────────────────────────────────
      const pages = await step.run("resolve-pages", async () => {
        await assertUnderCeiling(auditId);
        const results = await rankedPages(domain, userId, auditId, { limit: pageCap });

        await prisma.$transaction(
          results.map((p) =>
            prisma.page.upsert({
              where: { auditId_url: { auditId, url: p.url } },
              create: { auditId, url: p.url, estTraffic: p.estTraffic },
              update: { estTraffic: p.estTraffic },
            }),
          ),
        );

        const payload = toJson({
          totalEstTraffic: results.reduce((s, p) => s + p.estTraffic, 0),
          topPages: results.slice(0, 10),
        });

        await prisma.auditResult.upsert({
          where: { auditId_category: { auditId, category: "traffic" } },
          create: { auditId, category: "traffic", payload },
          update: { payload },
        });

        return results;
      });

      // ── Step 2: On-page SEO ────────────────────────────────────────────────
      await step.run("onpage", async () => {
        await assertUnderCeiling(auditId);
        const urls = pages.map((p) => p.url);
        const results = await onPage(urls, userId, auditId);

        await prisma.$transaction(
          results.map((r) =>
            prisma.page.updateMany({
              where: { auditId, url: r.url },
              data: { onPageIssues: toJson(r) },
            }),
          ),
        );

        const totalIssues = results.reduce((s, r) => s + r.issues.length, 0);
        const score = Math.max(0, 100 - totalIssues * 5);
        const payload = toJson({ pages: results });

        await prisma.auditResult.upsert({
          where: { auditId_category: { auditId, category: "onpage" } },
          create: { auditId, category: "onpage", score, payload },
          update: { score, payload },
        });
      });

      // ── Step 3: Performance (PageSpeed) ───────────────────────────────────
      await step.run("perf", async () => {
        await assertUnderCeiling(auditId);
        const urls = pages.slice(0, 5).map((p) => p.url);
        const results = await Promise.all(
          urls.map((url) => fetchPageSpeed(url, userId, auditId)),
        );

        await prisma.$transaction(
          results.map((r) =>
            prisma.page.updateMany({
              where: { auditId, url: r.url },
              data: { perf: toJson(r) },
            }),
          ),
        );

        const avgLcp =
          results.reduce((s, r) => s + (r.lcp ?? 0), 0) / (results.length || 1);
        const score = avgLcp < 2500 ? 90 : avgLcp < 4000 ? 60 : 30;
        const payload = toJson({ pages: results });

        await prisma.auditResult.upsert({
          where: { auditId_category: { auditId, category: "perf" } },
          create: { auditId, category: "perf", score, payload },
          update: { score, payload },
        });
      });

      // ── Step 4: Broken links ───────────────────────────────────────────────
      await step.run("links", async () => {
        await assertUnderCeiling(auditId);
        const urls = pages.map((p) => p.url);
        const results = await checkBrokenLinks(urls);

        const brokenCount = results.filter((r) => r.broken).length;
        const score = Math.max(0, 100 - brokenCount * 10);
        const payload = toJson({ links: results, brokenCount });

        await prisma.auditResult.upsert({
          where: { auditId_category: { auditId, category: "links" } },
          create: { auditId, category: "links", score, payload },
          update: { score, payload },
        });
      });

      // ── Step 5+6: Authority (backlinks + domain rank) ──────────────────────
      await step.run("authority", async () => {
        await assertUnderCeiling(auditId);
        const [bl, dr] = await Promise.all([
          backlinks(domain, userId, auditId),
          domainRank(domain, userId, auditId),
        ]);

        const score = Math.min(100, Math.round((dr.rank / 1_000_000) * 100));
        const payload = toJson({ backlinks: bl, domainRank: dr });

        await prisma.auditResult.upsert({
          where: { auditId_category: { auditId, category: "authority" } },
          create: { auditId, category: "authority", score, payload },
          update: { score, payload },
        });
      });

      // ── Step 7: Keywords ───────────────────────────────────────────────────
      await step.run("keywords", async () => {
        await assertUnderCeiling(auditId);
        const kws = await keywordData(domain, userId, auditId);

        await prisma.$transaction([
          prisma.keyword.deleteMany({ where: { auditId } }),
          ...kws.map((k) =>
            prisma.keyword.create({
              data: {
                auditId,
                term: k.keyword,
                volume: k.volume,
                difficulty: k.difficulty,
                cpc: k.cpc,
                intent: k.intent,
              },
            }),
          ),
        ]);

        const avgDifficulty =
          kws.reduce((s, k) => s + k.difficulty, 0) / (kws.length || 1);
        const score = Math.max(0, 100 - Math.round(avgDifficulty));
        const payload = toJson({ count: kws.length, avgDifficulty });

        await prisma.auditResult.upsert({
          where: { auditId_category: { auditId, category: "keywords" } },
          create: { auditId, category: "keywords", score, payload },
          update: { score, payload },
        });
      });

      // ── Steps 8–9: GEO — prompts, probe engines, parse, score ────────────────
      await step.run("geo-probe", async () => {
        await assertUnderCeiling(auditId);
        const kws = await prisma.keyword.findMany({
          where: { auditId },
          select: { term: true },
          take: 20,
        });
        await runGeoForAudit({ auditId, domain, plan, userId, keywords: kws.map((k) => k.term) });
      });

      // ── Step 10: Content generation ────────────────────────────────────────
      await step.run("content", async () => {
        await assertUnderCeiling(auditId);

        const [auditResults, dbPages, dbKeywords, geoRuns] = await Promise.all([
          prisma.auditResult.findMany({ where: { auditId } }),
          prisma.page.findMany({ where: { auditId }, take: 20, orderBy: { estTraffic: "desc" } }),
          prisma.keyword.findMany({ where: { auditId }, take: 10, orderBy: { volume: "desc" } }),
          prisma.geoRun.findMany({ where: { auditId } }),
        ]);

        const scoreFor = (cat: string) =>
          auditResults.find((r) => r.category === cat)?.score ?? null;

        const onpageData = auditResults.find((r) => r.category === "onpage")?.payload as
          | { pages?: Array<{ url: string; title?: string | null; description?: string | null; h1?: string[]; issues?: string[] }> }
          | undefined;

        const topIssues = onpageData?.pages?.flatMap((p) => p.issues ?? []) ?? [];
        const allCompetitors = geoRuns
          .flatMap((r) => (Array.isArray(r.competitorsNamed) ? (r.competitorsNamed as string[]) : []))
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 10);

        const uniqueGeoPrompts = geoRuns.map((r) => r.prompt).filter((v, i, a) => a.indexOf(v) === i);

        const [fixList, rewrites, geoBrief] = await Promise.all([
          generateFixList(
            {
              domain,
              onpageScore: scoreFor("onpage"),
              perfScore: scoreFor("perf"),
              linksScore: scoreFor("links"),
              authorityScore: scoreFor("authority"),
              keywordsScore: scoreFor("keywords"),
              geoScore: scoreFor("geo"),
              topIssues,
              topKeywords: dbKeywords.map((k) => k.term),
              geoMentioned: geoRuns.some((r) => r.mentioned),
              geoCited: geoRuns.some((r) => r.cited),
              topCompetitors: allCompetitors,
            },
            plan,
            userId,
            auditId,
          ),
          generateRewrites(
            dbPages.map((p) => ({
              url: p.url,
              title: (p.onPageIssues as { title?: string } | null)?.title ?? null,
              description: (p.onPageIssues as { description?: string } | null)?.description ?? null,
              h1: (p.onPageIssues as { h1?: string[] } | null)?.h1 ?? [],
              keywords: dbKeywords.map((k) => k.term),
            })),
            domain,
            plan,
            userId,
            auditId,
          ),
          generateGeoBrief(
            domain,
            scoreFor("geo") ?? 0,
            uniqueGeoPrompts,
            allCompetitors,
            geoRuns.some((r) => r.mentioned),
            geoRuns.some((r) => r.cited),
            plan,
            userId,
            auditId,
          ),
        ]);

        const gaps = await generateContentGaps(
          domain,
          dbKeywords.map((k) => k.term),
          allCompetitors,
          uniqueGeoPrompts,
          plan,
          userId,
          auditId,
        );

        const payload = toJson({ fixList, rewrites, geoBrief, gaps });

        await prisma.auditResult.upsert({
          where: { auditId_category: { auditId, category: "content" } },
          create: { auditId, category: "content", payload },
          update: { payload },
        });
      });

      // ── Aggregate overall score + mark done ───────────────────────────────
      await step.run("finalize", async () => {
        const results = await prisma.auditResult.findMany({ where: { auditId } });
        const scores = results.map((r) => r.score).filter((s): s is number => s !== null);
        const overallScore =
          scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : null;

        await prisma.audit.update({
          where: { id: auditId },
          data: { status: "done", finishedAt: new Date(), overallScore },
        });
      });
    } catch (err) {
      await prisma.audit
        .update({ where: { id: auditId }, data: { status: "failed", finishedAt: new Date() } })
        .catch(() => {});
      // Auth / permission errors won't resolve with retries — fail fast
      if (err instanceof HttpError && (err.status === 401 || err.status === 403)) {
        throw new NonRetriableError(err.message, { cause: err });
      }
      throw err;
    }
  },
);
