import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { removeCompetitor, CompetitorError } from "@/lib/competitors/manage";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const { id } = await params;
  try {
    await removeCompetitor(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof CompetitorError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "not_found" ? 404 : 400 });
    }
    throw err;
  }
}
