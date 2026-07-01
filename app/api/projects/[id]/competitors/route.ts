import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { domainSchema } from "@/lib/validation/domain";
import { addCompetitor, listCompetitors, CompetitorError } from "@/lib/competitors/manage";

const CreateSchema = z.object({ domain: domainSchema });

function errorStatus(code: CompetitorError["code"]): number {
  switch (code) {
    case "not_found":
      return 404;
    case "limit":
      return 402;
    case "duplicate":
      return 409;
    default:
      return 400;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const { id: projectId } = await params;
  try {
    const competitors = await listCompetitors(projectId, user.id);
    return NextResponse.json(competitors);
  } catch (err) {
    if (err instanceof CompetitorError) {
      return NextResponse.json({ error: err.message }, { status: errorStatus(err.code) });
    }
    throw err;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const { id: projectId } = await params;

  const parsed = CreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const competitor = await addCompetitor(projectId, user.id, user.plan, parsed.data.domain);
    return NextResponse.json(competitor, { status: 201 });
  } catch (err) {
    if (err instanceof CompetitorError) {
      return NextResponse.json(
        { error: err.message, upgrade: err.code === "limit" },
        { status: errorStatus(err.code) },
      );
    }
    throw err;
  }
}
