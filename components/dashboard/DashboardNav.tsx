"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "dashboard" },
  { href: "/dashboard/projects", label: "Projects", icon: "folder" },
  { href: "/dashboard/integrations", label: "Integrations", icon: "link" },
  { href: "/dashboard/costs", label: "Costs", icon: "monitoring" },
  { href: "/dashboard/billing", label: "Billing", icon: "credit_card" },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1 px-4">
      {NAV.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
              isActive
                ? "bg-primary-light font-semibold text-primary"
                : "text-text-secondary hover:bg-surface-container-low hover:text-on-surface"
            )}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
