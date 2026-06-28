import { getCurrentUser } from "@/lib/auth/dev-user";
import { planFeatures } from "@/lib/plan/features";
import { getUsageSummary } from "@/lib/plan/enforce";
import { UpgradeButtons } from "@/components/billing/UpgradeButtons";

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  agency: "Agency",
};

const PRICING = [
  {
    name: "Free",
    price: "$0",
    features: [
      "1 website",
      "2 full audits/month",
      "3 pages/audit · 50 pages/month",
      "10 keywords tracked",
      "1 AI engine (Gemini)",
      "30-day trend history",
    ],
  },
  {
    name: "Pro",
    price: "$99/mo",
    features: [
      "3 websites",
      "Unlimited audits",
      "50 pages/audit · 3,000 pages/month",
      "400 keywords tracked",
      "3 AI engines",
      "Weekly GEO re-checks",
      "CSV export + white-label PDF",
      "Shareable links (30 days)",
      "GSC connect (beta)",
      "90-day trend history",
    ],
  },
  {
    name: "Agency",
    price: "$199/mo",
    features: [
      "15 websites",
      "Unlimited audits",
      "150 pages/audit · 40,000 pages/month",
      "1,300 keywords tracked",
      "All 4 AI engines",
      "Weekly full re-audits",
      "Competitor tracking",
      "Permanent shareable links",
      "White-label + custom colour",
      "6-month trend history",
    ],
  },
];

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  const features = planFeatures(user.plan);
  const usage = await getUsageSummary(user.id, user.plan);
  const { status } = await searchParams;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your plan and subscription.
        </p>
      </div>

      {status === "success" && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Your subscription has been activated. Welcome aboard!
        </div>
      )}
      {status === "cancelled" && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Checkout was cancelled. No changes were made.
        </div>
      )}

      {/* Current plan */}
      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Current plan</h2>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold">
            {PLAN_NAMES[user.plan] ?? user.plan}
          </span>
          {user.planRenewsAt && (
            <span className="text-sm text-muted-foreground">
              Renews{" "}
              {user.planRenewsAt.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Usage */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <UsageStat
            label="Websites"
            used={usage.websites.used}
            limit={usage.websites.limit}
          />
          {usage.auditsThisMonth.limit !== null && (
            <UsageStat
              label="Audits this month"
              used={usage.auditsThisMonth.used}
              limit={usage.auditsThisMonth.limit}
            />
          )}
          <UsageStat
            label="Pages this month"
            used={usage.pagesThisMonth.used}
            limit={usage.pagesThisMonth.limit}
          />
          <UsageStat
            label="Keywords tracked"
            used={usage.keywordsThisMonth.used}
            limit={usage.keywordsThisMonth.limit}
          />
        </div>

        {/* Extra info */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <InfoStat
            label="Pages/audit"
            value={String(features.pagesPerAudit)}
          />
          <InfoStat
            label="AI engines"
            value={String(features.aiEngines)}
          />
          <InfoStat
            label="AI prompts/audit"
            value={String(features.aiPromptsPerAudit)}
          />
          <InfoStat
            label="Trend history"
            value={`${features.trendDays} days`}
          />
        </div>

        <UpgradeButtons
          currentPlan={user.plan}
          hasSubscription={!!user.stripeCustomerId}
        />
      </section>

      {/* Pricing table */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Plans</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {PRICING.map((p) => (
            <div
              key={p.name}
              className={`rounded-lg border p-5 space-y-3 ${
                PLAN_NAMES[user.plan] === p.name
                  ? "border-primary bg-primary/5"
                  : ""
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">{p.name}</span>
                <span className="text-lg font-bold">{p.price}</span>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function UsageStat({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">
        {used.toLocaleString()}
        <span className="text-sm font-normal text-muted-foreground">
          /{limit.toLocaleString()}
        </span>
      </p>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={`h-1.5 rounded-full ${pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
