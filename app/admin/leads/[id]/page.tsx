import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";
import { LeadDetailForm } from "@/components/admin/LeadDetailForm";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const db = getDb();
  if (!db) notFound();
  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        {lead.firstName} {lead.lastName}
      </h1>
      <LeadDetailForm lead={lead} />
    </div>
  );
}
