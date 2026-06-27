/**
 * Content layer smoke test — exercises all four generators end-to-end.
 * Seeds a minimal audit with keywords and GeoRun rows, then verifies:
 *   generateFixList · generateRewrites · generateGeoBrief · generateContentGaps
 * Run: pnpm check:content
 */
import { prisma } from "@/lib/db";
import { generateFixList } from "@/lib/content/fixes";
import { generateRewrites } from "@/lib/content/rewrites";
import { generateGeoBrief } from "@/lib/content/geo-brief";
import { generateContentGaps } from "@/lib/content/gaps";

const DOMAIN = "ahrefs.com";
const USER_ID = "dev-user";
const COMPETITORS = ["semrush.com", "moz.com", "majestic.com"];

async function seedAudit() {
  const project = await prisma.project.upsert({
    where: { userId_domain: { userId: USER_ID, domain: DOMAIN } },
    create: { userId: USER_ID, domain: DOMAIN, displayName: DOMAIN },
    update: {},
  });

  const audit = await prisma.audit.create({
    data: { projectId: project.id, status: "running", startedAt: new Date() },
  });

  const keywords = [
    "seo tool", "backlink checker", "site audit", "keyword research tool",
    "rank tracker", "competitor analysis", "link building", "organic traffic",
  ];

  await prisma.keyword.createMany({
    data: keywords.map((term) => ({ auditId: audit.id, term, volume: 1000, difficulty: 50, cpc: 1.0 })),
    skipDuplicates: true,
  });

  // Seed GeoRun rows with competitors so gap analysis + brief have real input
  const prompts = [
    "best seo tool for small business",
    "how to check backlinks for my website",
    "keyword research tool comparison",
  ];

  for (const prompt of prompts) {
    await prisma.geoRun.create({
      data: {
        auditId: audit.id,
        engine: "gemini",
        prompt,
        mentioned: false,
        cited: false,
        prominence: 2,
        sentiment: "neutral",
        competitorsNamed: COMPETITORS,
        engineVersion: "v1",
      },
    });
  }

  return audit.id;
}

async function run() {
  console.log("── Content Layer Smoke Test ────────────────────");

  const auditId = await seedAudit();
  console.log(`✓ Audit seeded: ${auditId}`);

  const keywords = ["seo tool", "backlink checker", "site audit", "keyword research tool", "rank tracker"];
  const pages = [
    { url: `https://${DOMAIN}/`, title: "Ahrefs – SEO Tools", description: null, h1: ["SEO Tools"], keywords },
    { url: `https://${DOMAIN}/backlink-checker`, title: null, description: "Check backlinks free", h1: ["Backlink Checker"], keywords },
  ];

  // ── 1. Fix list ──────────────────────────────────────────────────────────
  console.log("\n[1] generateFixList (plan=free, cap=5)...");
  const fixes = await generateFixList(
    {
      domain: DOMAIN,
      onpageScore: 60,
      perfScore: 72,
      linksScore: 90,
      authorityScore: 55,
      keywordsScore: 45,
      geoScore: 20,
      topIssues: ["missing_description", "missing_h1"],
      topKeywords: keywords,
      geoMentioned: false,
      geoCited: false,
      topCompetitors: COMPETITORS,
    },
    "free",
    USER_ID,
    auditId,
  );
  console.log(`✓ ${fixes.length} fixes (expected ≤5):`);
  fixes.slice(0, 2).forEach((f) => console.log(`   [${f.impact}] ${f.category}: ${f.issue}`));

  // ── 2. Title/meta rewrites ───────────────────────────────────────────────
  console.log("\n[2] generateRewrites (plan=pro, top 5 pages)...");
  const rewrites = await generateRewrites(pages, DOMAIN, "pro", USER_ID, auditId);
  console.log(`✓ ${rewrites.length} rewrite(s):`);
  rewrites.slice(0, 1).forEach((r) => console.log(`   ${r.url}\n   Title: ${r.suggestedTitle}\n   Meta:  ${r.suggestedMeta}`));

  // ── 3. GEO brief ────────────────────────────────────────────────────────
  console.log("\n[3] generateGeoBrief (plan=agency)...");
  const brief = await generateGeoBrief(
    DOMAIN,
    20,
    ["best seo tool for small business", "how to check backlinks", "keyword research tool comparison"],
    COMPETITORS,
    false,
    false,
    "agency",
    USER_ID,
    auditId,
  );
  console.log(`✓ GEO brief:`);
  console.log(`   Summary: ${brief.summary.slice(0, 100)}...`);
  console.log(`   Entity tips: ${brief.entityClarityTips.length}, Topical gaps: ${brief.topicalGaps.length}`);
  console.log(`   FAQ schema present: ${brief.faqSchema.length > 0}`);

  // ── 4. Content gap analysis (Agency only) ────────────────────────────────
  console.log("\n[4] generateContentGaps (plan=agency)...");
  const gaps = await generateContentGaps(
    DOMAIN,
    keywords,
    COMPETITORS,
    ["best seo tool for small business", "how to check backlinks", "keyword research tool comparison"],
    "agency",
    USER_ID,
    auditId,
  );

  if (!gaps) {
    console.error("✗ generateContentGaps returned null for agency plan");
    process.exit(1);
  }

  console.log(`✓ Gap analysis:`);
  console.log(`   Competitors: ${gaps.competitors.join(", ")}`);
  console.log(`   Keyword gaps: ${gaps.keywordGaps.length}`);
  gaps.keywordGaps.slice(0, 2).forEach((g) => console.log(`   • ${g.topic}: [${g.targetKeywords.join(", ")}]`));
  console.log(`   Content outlines: ${gaps.outlines.length}`);
  gaps.outlines.slice(0, 1).forEach((o) => {
    console.log(`   • "${o.title}" (keyword: ${o.targetKeyword})`);
    console.log(`     Sections: ${o.sections.slice(0, 3).join(" | ")}`);
    console.log(`     GEO angle: ${o.geoAngle}`);
  });

  if (gaps.outlines.length !== 3) {
    console.warn(`⚠  Expected 3 outlines, got ${gaps.outlines.length}`);
  }

  // ── 5. Verify plan gating ────────────────────────────────────────────────
  console.log("\n[5] Verifying plan gating (free/pro → null)...");
  const freeGaps = await generateContentGaps(DOMAIN, keywords, COMPETITORS, [], "free", USER_ID, auditId);
  const proGaps = await generateContentGaps(DOMAIN, keywords, COMPETITORS, [], "pro", USER_ID, auditId);
  if (freeGaps !== null || proGaps !== null) {
    console.error("✗ Gap analysis should return null for free/pro plans");
    process.exit(1);
  }
  console.log("✓ Plan gating correct (free=null, pro=null)");

  // Cleanup
  await prisma.audit.delete({ where: { id: auditId } });
  console.log("\n✓ Test audit cleaned up");
  console.log("── Content layer working ✓ ─────────────────────");
}

run()
  .catch((err) => { console.error("✗ Content test failed:", err); process.exit(1); })
  .finally(() => prisma.$disconnect());
