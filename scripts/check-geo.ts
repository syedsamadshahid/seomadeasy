/**
 * Standalone GEO pipeline smoke test.
 * Seeds an audit + keywords directly, then exercises:
 *   generateGeoPrompts → probeEngine(gemini) → parseAndStoreGeoRun → computeGeoScore
 * Run: pnpm check:geo
 */
import { prisma } from "@/lib/db";
import { generateGeoPrompts } from "@/lib/geo/prompts";
import { probeEngine } from "@/lib/geo/probe";
import { parseAndStoreGeoRun } from "@/lib/geo/parse";
import { computeGeoScore, topCompetitors } from "@/lib/geo/score";

const DOMAIN = "ahrefs.com";
const USER_ID = "dev-user";

async function seedAudit() {
  const project = await prisma.project.upsert({
    where: { userId_domain: { userId: USER_ID, domain: DOMAIN } },
    create: { userId: USER_ID, domain: DOMAIN, displayName: DOMAIN },
    update: {},
  });

  const audit = await prisma.audit.create({
    data: { projectId: project.id, status: "running", startedAt: new Date() },
  });

  // Seed realistic keywords so prompt generation has something to work with
  const keywords = [
    "seo tool", "backlink checker", "site audit", "keyword research tool",
    "rank tracker", "competitor analysis", "domain authority checker",
    "link building tool", "organic traffic", "serp analysis",
  ];

  await prisma.keyword.createMany({
    data: keywords.map((term) => ({ auditId: audit.id, term, volume: 1000, difficulty: 50, cpc: 1.0 })),
    skipDuplicates: true,
  });

  return audit.id;
}

async function run() {
  console.log("── GEO Smoke Test ──────────────────────────────");

  // 1. Seed
  const auditId = await seedAudit();
  console.log(`✓ Audit seeded: ${auditId}`);

  // 2. Generate prompts (Gemini Flash)
  console.log("\n[1] Generating GEO prompts via Gemini Flash...");
  const prompts = await generateGeoPrompts(DOMAIN, [
    "seo tool", "backlink checker", "keyword research tool",
    "rank tracker", "site audit",
  ], "free", USER_ID, auditId); // free = 3 prompts
  console.log(`✓ Generated ${prompts.length} prompts:`);
  prompts.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));

  if (prompts.length === 0) {
    console.error("✗ No prompts generated — check GEMINI_API_KEY");
    process.exit(1);
  }

  // 3. Probe Gemini (only engine we have a key for)
  console.log("\n[2] Probing Gemini...");
  const probe = await probeEngine("gemini", prompts[0], DOMAIN, USER_ID, auditId);
  console.log(`✓ Response (${probe.response.length} chars): ${probe.response.slice(0, 120)}...`);

  // 4. Parse response
  console.log("\n[3] Parsing with Gemini Flash...");
  const parsed = await parseAndStoreGeoRun(
    auditId, "gemini", probe.prompt, probe.response, probe.citations, DOMAIN, USER_ID,
  );
  console.log(`✓ mentioned=${parsed.mentioned}, cited=${parsed.cited}, prominence=${parsed.prominence}, sentiment=${parsed.sentiment}`);
  console.log(`  competitors: ${parsed.competitorsNamed.join(", ") || "(none)"}`);

  // 5. Score
  const score = await computeGeoScore(auditId);
  const competitors = await topCompetitors(auditId);
  console.log(`\n[4] GEO Score: ${score}/100`);
  if (competitors.length > 0) {
    console.log(`  Top competitors: ${competitors.map((c) => `${c.name}(${c.count})`).join(", ")}`);
  }

  // 6. Verify DB
  const runs = await prisma.geoRun.findMany({ where: { auditId } });
  console.log(`\n✓ GeoRun rows in DB: ${runs.length}`);

  // Cleanup
  await prisma.audit.delete({ where: { id: auditId } });
  console.log("✓ Test audit cleaned up");
  console.log("\n── GEO pipeline working ✓ ──────────────────────");
}

run()
  .catch((err) => { console.error("✗ GEO test failed:", err); process.exit(1); })
  .finally(() => prisma.$disconnect());
