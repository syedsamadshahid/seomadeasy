import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import type { ShareLink } from "@prisma/client";

export function createShareToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function saveShareLink(
  auditId: string,
  expiresAt: Date | null,
): Promise<ShareLink> {
  const token = createShareToken();
  return prisma.shareLink.create({
    data: { token, auditId, expiresAt },
  });
}

export async function resolveShareLink(
  token: string,
): Promise<ShareLink | null> {
  const link = await prisma.shareLink.findUnique({ where: { token } });
  if (!link) return null;
  if (link.expiresAt && link.expiresAt < new Date()) return null;
  return link;
}
