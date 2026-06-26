import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/dev-user";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {user.email}
          </p>
        </div>
        <Button disabled>New audit</Button>
      </header>

      <Card className="mt-8 border-dashed">
        <CardHeader>
          <CardTitle>No audits yet</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The audit pipeline lands in Phase 2. Once it does, your SEO and AI
          visibility reports will show up here.
        </CardContent>
      </Card>
    </div>
  );
}
