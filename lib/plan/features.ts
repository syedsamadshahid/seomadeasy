import type { Plan } from "@prisma/client";

export type PlanFeatures = {
  // ── Trend / share / export ───────────────────────────────
  trendDays: number;
  canExportCsv: boolean;
  canWhiteLabel: boolean;   // pro+agency: logo URL + domain
  canCustomColor: boolean;  // agency only
  canShare: boolean;        // pro+agency
  shareExpiryDays: number | null; // pro=30, agency=null (permanent)
  canMultiSite: boolean;    // agency only
  canSchedule: boolean;     // agency only
  canGeoRecheck: boolean;   // pro+agency: weekly GEO re-checks
  canFullReaudit: boolean;  // agency only: weekly full re-audits

  // ── Hard plan limits ────────────────────────────────────
  websiteLimit: number;             // free=1, pro=3, agency=15
  monthlyAuditLimit: number | null; // free=2, pro/agency=null (unlimited)
  pagesPerAudit: number;            // free=3, pro=50, agency=150
  pagesPoolPerMonth: number;        // free=50, pro=3000, agency=40000
  keywordsTracked: number;          // free=10, pro=400, agency=1300
  aiEngines: number;                // free=1, pro=3, agency=4
  aiPromptsPerAudit: number;        // free=3, pro=10, agency=20
  contentRecModel: string;          // free="gemini-flash", pro="gemini-pro", agency="claude-sonnet"

  // ── Competitor tracking ─────────────────────────────────
  canCompetitorTracking: boolean;   // derived: maxCompetitors > 0
  maxCompetitors: number;           // free=1, pro=3, agency=10
};

export function planFeatures(plan: Plan): PlanFeatures {
  switch (plan) {
    case "agency":
      return {
        trendDays: 180,
        canExportCsv: true,
        canWhiteLabel: true,
        canCustomColor: true,
        canShare: true,
        shareExpiryDays: null,
        canMultiSite: true,
        canSchedule: true,
        canGeoRecheck: true,
        canFullReaudit: true,
        websiteLimit: 15,
        monthlyAuditLimit: null,
        pagesPerAudit: 150,
        pagesPoolPerMonth: 40_000,
        keywordsTracked: 1300,
        aiEngines: 4,
        aiPromptsPerAudit: 20,
        contentRecModel: "claude-sonnet",
        canCompetitorTracking: true,
        maxCompetitors: 10,
      };
    case "pro":
      return {
        trendDays: 90,
        canExportCsv: true,
        canWhiteLabel: true,
        canCustomColor: false,
        canShare: true,
        shareExpiryDays: 30,
        canMultiSite: false,
        canSchedule: false,
        canGeoRecheck: true,
        canFullReaudit: false,
        websiteLimit: 3,
        monthlyAuditLimit: null,
        pagesPerAudit: 50,
        pagesPoolPerMonth: 3_000,
        keywordsTracked: 400,
        aiEngines: 3,
        aiPromptsPerAudit: 10,
        contentRecModel: "gemini-pro",
        canCompetitorTracking: true,
        maxCompetitors: 3,
      };
    default: // "free"
      return {
        trendDays: 30,
        canExportCsv: false,
        canWhiteLabel: false,
        canCustomColor: false,
        canShare: false,
        shareExpiryDays: null,
        canMultiSite: false,
        canSchedule: false,
        canGeoRecheck: false,
        canFullReaudit: false,
        websiteLimit: 1,
        monthlyAuditLimit: 2,
        pagesPerAudit: 3,
        pagesPoolPerMonth: 50,
        keywordsTracked: 10,
        aiEngines: 1,
        aiPromptsPerAudit: 3,
        contentRecModel: "gemini-flash",
        canCompetitorTracking: true,
        maxCompetitors: 1,
      };
  }
}
