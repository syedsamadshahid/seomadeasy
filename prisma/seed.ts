import { prisma } from "../lib/db";

// Seeds the hardcoded dev user used throughout Phases 1–6 (before real auth
// lands in Phase 7). Idempotent: safe to re-run.

async function main() {
  const devUserId = process.env.DEV_USER_ID ?? "dev-user";

  const user = await prisma.user.upsert({
    where: { id: devUserId },
    update: {},
    create: {
      id: devUserId,
      email: "dev@vantage.local",
      plan: "agency",
    },
  });

  console.log(`Seeded dev user: ${user.id} (plan: ${user.plan})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
