import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { runAudit } from "@/inngest/functions/run-audit";
import { scheduledReports } from "@/inngest/functions/scheduled-reports";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runAudit, scheduledReports],
});
