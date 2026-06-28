import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/db", () => ({
  prisma: {
    usageEvent: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    audit: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../lib/audit/cost", () => ({
  PER_AUDIT_CEILING_CENTS: 200,
}));

import { costByVendor, auditsOverCeiling } from "../lib/usage/aggregates";
import { prisma } from "../lib/db";

describe("costByVendor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps groupBy results to VendorCost shape", async () => {
    vi.mocked(prisma.usageEvent.groupBy).mockResolvedValue([
      { vendor: "gemini", _sum: { costCents: 150 }, _count: { id: 5 } },
      { vendor: "openai", _sum: { costCents: 300 }, _count: { id: 10 } },
    ] as never);

    const result = await costByVendor();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ vendor: "gemini", totalCents: 150, callCount: 5 });
    expect(result[1]).toMatchObject({ vendor: "openai", totalCents: 300, callCount: 10 });
  });

  it("handles null _sum.costCents as 0", async () => {
    vi.mocked(prisma.usageEvent.groupBy).mockResolvedValue([
      { vendor: "pagespeed", _sum: { costCents: null }, _count: { id: 3 } },
    ] as never);
    const result = await costByVendor();
    expect(result[0].totalCents).toBe(0);
  });
});

describe("auditsOverCeiling", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns audits with costCents at or above ceiling", async () => {
    vi.mocked(prisma.audit.findMany).mockResolvedValue([
      {
        id: "audit-123",
        costCents: 200,
        finishedAt: new Date("2024-01-15"),
        project: { domain: "example.com" },
      },
    ] as never);

    const result = await auditsOverCeiling();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      auditId: "audit-123",
      domain: "example.com",
      costCents: 200,
    });
  });

  it("returns empty array when no audits exceed ceiling", async () => {
    vi.mocked(prisma.audit.findMany).mockResolvedValue([] as never);
    const result = await auditsOverCeiling();
    expect(result).toHaveLength(0);
  });
});
