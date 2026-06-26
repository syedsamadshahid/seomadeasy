import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Single Prisma client wired to the Neon serverless driver adapter.
// Runtime queries go over Neon's pooled HTTP connection (DATABASE_URL),
// which avoids connection-pool exhaustion on serverless. Migrations use
// DIRECT_URL (configured in prisma/schema.prisma), not this client.

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add the Neon pooled connection string to .env.",
  );
}

const adapter = new PrismaNeon({ connectionString });

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// Reuse the client across hot reloads in development to avoid exhausting
// connections; always fresh in production.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
