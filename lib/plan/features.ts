import type { Plan } from "@prisma/client";

export type PlanFeatures = {
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
  websiteLimit: number;         // free=1, pro=3, agency=15
  monthlyAuditLimit: number | null; // free=2, pro/agency=null (unlimited)
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
      };
  }
}
