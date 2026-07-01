import { Inngest, eventType, staticSchema } from "inngest";

export const auditRequested = eventType("audit/requested", {
  schema: staticSchema<{ auditId: string }>(),
});

export const comparisonRequested = eventType("comparison/requested", {
  schema: staticSchema<{ groupId: string }>(),
});

export const inngest = new Inngest({ id: "vantage" });
