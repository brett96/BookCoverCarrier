import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sp = await searchParams;
  const db = getDb();
  if (!db) {
    return <p className="text-slate-600">Database not configured.</p>;
  }

  const rows =
    sp.status && sp.status !== "all"
      ? await db
          .select()
          .from(leads)
          .where(eq(leads.status, sp.status))
          .orderBy(desc(leads.createdAt))
      : await db.select().from(leads).orderBy(desc(leads.createdAt));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        {["all", "new", "contacted", "qualified", "disqualified", "won"].map(
          (s) => (
            <Link
              key={s}
              href={s === "all" ? "/admin/leads" : `/admin/leads?status=${s}`}
              className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50"
            >
              {s}
            </Link>
          )
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((l) => (
            <TableRow key={l.id}>
              <TableCell>
                <Link
                  href={`/admin/leads/${l.id}`}
                  className="font-medium text-blue-700 hover:underline"
                >
                  {l.firstName} {l.lastName}
                </Link>
              </TableCell>
              <TableCell>{l.organization}</TableCell>
              <TableCell>{l.email}</TableCell>
              <TableCell>
                <Badge variant="secondary">{l.status}</Badge>
              </TableCell>
              <TableCell className="text-slate-500">
                {l.createdAt.toISOString().slice(0, 10)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
