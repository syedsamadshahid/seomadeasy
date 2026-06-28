import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { runAudit } from "@/inngest/functions/run-audit";
import { scheduledReports } from "@/inngest/functions/scheduled-reports";
import { scheduledGeo } from "@/inngest/functions/scheduled-geo";
import { scheduledFullAudit } from "@/inngest/functions/scheduled-full-audit";
import { monthlyUsageSummary } from "@/inngest/functions/monthly-reset";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runAudit, scheduledReports, scheduledGeo, scheduledFullAudit, monthlyUsageSummary],
});
