import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/client";
import { funnelCounts, utmFunnel } from "@/lib/analytics";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function FunnelPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const db = getDb();
  if (!db) {
    return <p className="text-slate-600">Database not configured.</p>;
  }
  const [funnel, utm] = await Promise.all([funnelCounts(db, 30), utmFunnel(db, 30)]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Conversion funnel</h1>
      <Card>
        <CardHeader>
          <CardTitle>Distinct visitors (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {Object.entries(funnel).map(([step, n]) => (
              <li key={step} className="flex justify-between gap-8">
                <span className="capitalize">{step.replace(/_/g, " ")}</span>
                <span className="font-semibold">{n}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>By traffic source (UTM)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Pageviews</th>
                  <th className="py-2 pr-4">Form submits</th>
                  <th className="py-2">Rate</th>
                </tr>
              </thead>
              <tbody>
                {utm.map((r) => (
                  <tr key={r.source} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{r.source}</td>
                    <td className="py-2 pr-4">{r.pageviews}</td>
                    <td className="py-2 pr-4">{r.submits}</td>
                    <td className="py-2">{r.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
