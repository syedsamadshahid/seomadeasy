// Fixture-based smoke test for the Phase 2 pipeline.
// Validates that DB helpers and the DataForSEO client types work end-to-end
// without calling any real external APIs.
// Run with: pnpm check:audit
export {};

import { prisma } from "../lib/db";
import { createAudit, assembleResults } from "../lib/audit/create";
import { pageCapForPlan, PER_AUDIT_CEILING_CENTS } from "../lib/audit/cost";

const TEST_USER_ID = process.env.DEV_USER_ID ?? "dev-user";
const TEST_DOMAIN = `smoke-test-${Date.now()}.example.com`;

async function main() {
  console.log("── Phase 2 smoke test ──");

  // 1. createAudit creates a Project + Audit
  const { auditId } = await createAudit(TEST_USER_ID, TEST_DOMAIN);
  console.log("✓ createAudit returned auditId:", auditId);

  // 2. Audit starts in queued status
  const initial = await assembleResults(auditId, TEST_USER_ID);
  if (!initial || initial.status !== "queued") {
    throw new Error(`Expected status queued, got: ${initial?.status}`);
  }
  console.log("✓ Audit status is queued");

  // 3. Manually transition to running + write an AuditResult (simulates Inngest step)
  await prisma.audit.update({ where: { id: auditId }, data: { status: "running" } });
  await prisma.auditResult.create({
    data: {
      auditId,
      category: "onpage",
      score: 75,
      payload: { pages: [], fixture: true },
    },
  });
  await prisma.page.create({
    data: { auditId, url: `https://${TEST_DOMAIN}/`, estTraffic: 1000 },
  });
  await prisma.usageEvent.create({
    data: {
      userId: TEST_USER_ID,
      auditId,
      vendor: "dataforseo",
      endpoint: "on_page_content_parsing",
      units: 1,
      costCents: 1,
    },
  });
  console.log("✓ Wrote AuditResult(onpage) + Page + UsageEvent");

  // 4. Transition to done + verify assembleResults
  await prisma.audit.update({
    where: { id: auditId },
    data: { status: "done", finishedAt: new Date(), overallScore: 75 },
  });

  const assembled = await assembleResults(auditId, TEST_USER_ID);
  if (!assembled) throw new Error("assembleResults returned null");
  if (assembled.status !== "done") throw new Error(`Expected done, got: ${assembled.status}`);
  if (assembled.results.length !== 1) throw new Error("Expected 1 AuditResult");
  if (assembled.pages.length !== 1) throw new Error("Expected 1 Page");
  console.log("✓ assembleResults returns full audit with results and pages");

  // 5. Page caps
  if (pageCapForPlan("free") !== 3) throw new Error("Free cap should be 3");
  if (pageCapForPlan("pro") !== 50) throw new Error("Pro cap should be 50");
  if (pageCapForPlan("agency") !== 150) throw new Error("Agency cap should be 150");
  console.log("✓ pageCapForPlan: free=3 pro=50 agency=150");

  // 6. Cost ceiling constant
  if (PER_AUDIT_CEILING_CENTS !== 200) throw new Error("Ceiling should be 200 cents");
  console.log("✓ PER_AUDIT_CEILING_CENTS =", PER_AUDIT_CEILING_CENTS, "($2.00)");

  // Cleanup
  await prisma.audit.delete({ where: { id: auditId } });
  console.log("\nAll Phase 2 smoke checks passed.");
}

main()
  .catch((err) => {
    console.error("Smoke test FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
