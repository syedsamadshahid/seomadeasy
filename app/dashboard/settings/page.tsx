import { getCurrentUser } from "@/lib/auth/dev-user";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfileForm } from "@/components/dashboard/ProfileForm";

type Tab = "profile" | "sites" | "billing" | "integrations";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "profile",      label: "Profile",       icon: "person"     },
  { id: "sites",        label: "Sites",         icon: "language"   },
  { id: "billing",      label: "Billing",       icon: "credit_card"},
  { id: "integrations", label: "Integrations",  icon: "link"       },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const tab = (params.tab as Tab) ?? "profile";

  if (!TABS.find((t) => t.id === tab)) redirect("/dashboard/settings");

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="max-w-[900px] mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-on-background tracking-tight">Settings</h1>
          <p className="text-text-secondary text-sm mt-1">Manage your account, billing, and integrations.</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-surface-alt rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/settings?tab=${t.id}`}
              className={[
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                tab === t.id
                  ? "bg-white text-primary shadow-sm border border-border"
                  : "text-text-secondary hover:text-on-surface",
              ].join(" ")}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </Link>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white border border-border rounded-xl p-8">
          {tab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-lg font-black text-on-background">Profile</h2>
              <ProfileForm
                name={(user as Record<string, unknown>).name as string | null ?? null}
                jobTitle={(user as Record<string, unknown>).jobTitle as string | null ?? null}
                timezone={(user as Record<string, unknown>).timezone as string | null ?? null}
                email={user.email}
                plan={user.plan}
              />
            </div>
          )}

          {tab === "sites" && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-on-background">Sites</h2>
              <p className="text-sm text-text-secondary">
                Manage your tracked sites and domains.{" "}
                <Link href="/dashboard/sites" className="text-primary font-bold hover:underline">
                  Go to My Sites →
                </Link>
              </p>
            </div>
          )}

          {tab === "billing" && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-on-background">Billing & Plan</h2>
              {/* Inline the billing content from the old billing page */}
              <div className="rounded-lg bg-primary-light border border-primary/20 p-4 flex items-center gap-4">
                <span className="material-symbols-outlined text-primary text-3xl">workspace_premium</span>
                <div>
                  <p className="font-black text-on-background capitalize">{user.plan} Plan</p>
                  <p className="text-sm text-text-secondary">
                    {user.plan === "free"
                      ? "Upgrade to Pro or Agency for more audits, AI engines, and sites."
                      : "Thank you for being a subscriber."}
                  </p>
                </div>
              </div>
              {user.plan !== "agency" && (
                <Link
                  href="/pricing"
                  className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary-container transition-colors"
                >
                  View Plans & Upgrade
                </Link>
              )}
            </div>
          )}

          {tab === "integrations" && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-on-background">Integrations</h2>
              <p className="text-sm text-text-secondary">
                Connect Google Search Console, Google Analytics, and other tools.{" "}
                <Link href="/dashboard/integrations" className="text-primary font-bold hover:underline">
                  Manage Integrations →
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
