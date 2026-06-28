import { describe, it, expect, vi } from "vitest";

// Mock prisma before importing the score module
vi.mock("../lib/db", () => ({
  prisma: {
    geoRun: {
      findMany: vi.fn(),
    },
  },
}));

import { computeGeoScore } from "../lib/geo/score";
import { prisma } from "../lib/db";

function makeRun(overrides: Partial<{
  mentioned: boolean;
  cited: boolean;
  prominence: number | null;
  sentiment: string | null;
}> = {}) {
  return {
    mentioned: false,
    cited: false,
    prominence: null,
    sentiment: null,
    ...overrides,
  };
}

describe("GEO score formula", () => {
  it("scores 0 for no mentions, no citations, no prominence, neutral sentiment", async () => {
    vi.mocked(prisma.geoRun.findMany).mockResolvedValue([makeRun()] as never);
    const score = await computeGeoScore("audit-1");
    expect(score).toBe(0);
  });

  it("scores 30 for mention only", async () => {
    vi.mocked(prisma.geoRun.findMany).mockResolvedValue([makeRun({ mentioned: true })] as never);
    const score = await computeGeoScore("audit-1");
    expect(score).toBe(30);
  });

  it("scores 70 for mention + citation (30 + 40)", async () => {
    vi.mocked(prisma.geoRun.findMany).mockResolvedValue([
      makeRun({ mentioned: true, cited: true }),
    ] as never);
    const score = await computeGeoScore("audit-1");
    expect(score).toBe(70);
  });

  it("adds prominence correctly (prominence=10 → +20)", async () => {
    vi.mocked(prisma.geoRun.findMany).mockResolvedValue([
      makeRun({ mentioned: true, cited: true, prominence: 10 }),
    ] as never);
    const score = await computeGeoScore("audit-1");
    expect(score).toBe(90); // 30+40+20
  });

  it("positive sentiment adds 10 points", async () => {
    vi.mocked(prisma.geoRun.findMany).mockResolvedValue([
      makeRun({ mentioned: true, cited: true, prominence: 10, sentiment: "positive" }),
    ] as never);
    const score = await computeGeoScore("audit-1");
    expect(score).toBe(100); // capped at 100
  });

  it("negative sentiment subtracts 10 points", async () => {
    vi.mocked(prisma.geoRun.findMany).mockResolvedValue([
      makeRun({ mentioned: true, sentiment: "negative" }),
    ] as never);
    const score = await computeGeoScore("audit-1");
    expect(score).toBe(20); // 30 - 10
  });

  it("averages scores across multiple runs", async () => {
    vi.mocked(prisma.geoRun.findMany).mockResolvedValue([
      makeRun({ mentioned: true }),   // 30
      makeRun({}),                    // 0
    ] as never);
    const score = await computeGeoScore("audit-1");
    expect(score).toBe(15); // (30 + 0) / 2
  });

  it("returns 0 for empty runs", async () => {
    vi.mocked(prisma.geoRun.findMany).mockResolvedValue([] as never);
    const score = await computeGeoScore("audit-1");
    expect(score).toBe(0);
  });
});
