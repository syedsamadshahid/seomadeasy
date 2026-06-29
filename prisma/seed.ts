import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const id = process.env.DEV_USER_ID ?? "dev-user";

  await prisma.user.upsert({
    where: { id },
    create: {
      id,
      email: "dev@vantage.local",
      plan: "agency",
    },
    update: {},
  });

  console.log(`Seed: dev user upserted (id=${id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
