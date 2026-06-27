import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { assembleResults } from "@/lib/audit/create";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const result = await assembleResults(id, user.id);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
