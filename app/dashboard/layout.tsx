import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dev-user";

const NAV = [
  { href: "/dashboard", label: "Overview", enabled: true },
  { href: "/dashboard/projects", label: "Projects", enabled: false },
  { href: "/dashboard/audits", label: "Audits", enabled: false },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-muted/30 p-4 md:flex">
        <Link href="/" className="px-2 py-3 text-lg font-semibold tracking-tight">
          Vantage
        </Link>
        <nav className="mt-4 flex flex-col gap-1">
          {NAV.map((item) =>
            item.enabled ? (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.href}
                className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-muted-foreground/50"
                title="Coming in a later phase"
              >
                {item.label}
              </span>
            ),
          )}
        </nav>
        <div className="mt-auto rounded-md border bg-background p-3 text-xs">
          <div className="font-medium">{user.email}</div>
          <div className="mt-0.5 capitalize text-muted-foreground">
            {user.plan} plan
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
