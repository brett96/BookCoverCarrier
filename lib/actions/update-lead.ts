"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "qualified", "disqualified", "won"]),
  notes: z.string().max(5000).optional().nullable(),
});

export type UpdateLeadState = { ok: boolean; message?: string };

export async function updateLead(
  _prev: UpdateLeadState | undefined,
  formData: FormData
): Promise<UpdateLeadState> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, message: "Unauthorized" };

  const parsed = schema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    notes: (formData.get("notes") as string) || null,
  });
  if (!parsed.success) {
    return { ok: false, message: "Invalid data" };
  }

  const db = getDb();
  if (!db) return { ok: false, message: "No database" };

  await db
    .update(leads)
    .set({
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, parsed.data.id));

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${parsed.data.id}`);
  return { ok: true };
}
