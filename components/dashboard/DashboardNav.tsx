"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Plan } from "@prisma/client";

const NAV = [
  { href: "/dashboard",              label: "Dashboard",     icon: "dashboard"            },
  { href: "/dashboard/sites",        label: "My Sites",      icon: "language"             },
  { href: "/dashboard/ai-visibility",label: "AI Visibility", icon: "auto_awesome"         },
  { href: "/dashboard/audits",       label: "SEO Audits",    icon: "assignment_turned_in" },
  { href: "/dashboard/keywords",     label: "Keywords",      icon: "key"                  },
  { href: "/dashboard/reports",      label: "Reports",       icon: "description"          },
  { href: "/dashboard/settings",     label: "Settings",      icon: "settings"             },
];

type Props = {
  plan?: Plan;
};

export function DashboardNav({ plan }: Props) {
  const pathname = usePathname();

  return (
    <>
      <nav className="space-y-1 px-4">
        {NAV.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                isActive
                  ? "sidebar-active text-on-surface"
                  : "text-on-surface-variant hover:bg-surface-container-low transition-colors"
              )}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Upgrade card for non-agency plans */}
      {plan && plan !== "agency" && (
        <div className="mx-4 mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
          <p className="text-xs font-black text-on-surface uppercase tracking-wider mb-1">
            {plan === "free" ? "Free Plan" : "Pro Plan"}
          </p>
          <p className="text-xs text-text-secondary mb-3 leading-relaxed">
            {plan === "free"
              ? "Unlock Pro for unlimited audits and AI visibility across all engines."
              : "Upgrade to Agency for unlimited sites and white-label reports."}
          </p>
          <Link
            href="/dashboard/settings?tab=billing"
            className="block w-full text-center bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primary-container transition-colors"
          >
            Upgrade Plan
          </Link>
        </div>
      )}
    </>
  );
}
