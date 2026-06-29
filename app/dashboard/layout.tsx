import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { NewAuditDialog } from "@/components/dashboard/NewAuditDialog";

// Dashboard routes are per-user and authenticated — never statically prerender
// them at build time (the DB is not reachable during prerender).
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const initials = (user.email.slice(0, 2)).toUpperCase();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/20 bg-white/90 backdrop-blur-xl md:flex z-50">
        {/* Brand */}
        <div className="p-6 flex flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <div className="bg-primary size-8 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="text-white size-5" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor" />
              </svg>
            </div>
            <Link href="/" className="text-xl font-bold tracking-tight text-on-background">
              Vantage
            </Link>
          </div>
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.12em] pl-11">
            AI Visibility Suite
          </p>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2">
          <DashboardNav plan={user.plan} />
        </div>

        {/* Profile footer */}
        <div className="p-4 border-t border-outline-variant/30">
          <div className="flex items-center gap-3 p-2 mb-2">
            <div className="size-9 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-sm border border-primary-fixed-dim/20 flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{user.email}</p>
              <p className="text-xs text-text-secondary capitalize">{user.plan} Plan</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main panel */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Top App Bar */}
        <header className="h-16 border-b border-white/20 bg-white/40 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                search
              </span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-white/50 border border-white/40 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none placeholder:text-text-secondary"
                placeholder="Search sites, audits, or keywords…"
                type="search"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="size-10 flex items-center justify-center rounded-lg hover:bg-white/50 text-on-surface-variant relative"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-danger rounded-full border-2 border-white" />
            </button>
            <NewAuditDialog />
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
