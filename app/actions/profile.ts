"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { prisma } from "@/lib/db";

const ProfileSchema = z.object({
  name: z.string().max(80).optional(),
  jobTitle: z.string().max(80).optional(),
  timezone: z.string().max(64).optional(),
});

export type ProfileState = {
  success: boolean;
  error: string | null;
};

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getCurrentUser();

  const parsed = ProfileSchema.safeParse({
    name: formData.get("name") ?? undefined,
    jobTitle: formData.get("jobTitle") ?? undefined,
    timezone: formData.get("timezone") ?? undefined,
  });

  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma.user.update as any)({
    where: { id: user.id },
    data: parsed.data,
  });

  revalidatePath("/dashboard/settings");
  return { success: true, error: null };
}
