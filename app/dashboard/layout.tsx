import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

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
        <DashboardNav />
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
