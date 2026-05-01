import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/client";
import {
  pageviewsByDay,
  topCountries,
  topPaths,
  topReferrers,
  deviceBreakdown,
} from "@/lib/analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VisitorsAreaChart } from "@/components/admin/VisitorsAreaChart";

export default async function TrafficPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const db = getDb();
  if (!db) {
    return <p className="text-slate-600">Database not configured.</p>;
  }
  const [series, paths, refs, countries, devices] = await Promise.all([
    pageviewsByDay(db, 30),
    topPaths(db, 30, 12),
    topReferrers(db, 30, 12),
    topCountries(db, 30, 12),
    deviceBreakdown(db, 30),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Traffic</h1>
      <Card>
        <CardHeader>
          <CardTitle>Visitors by day</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <VisitorsAreaChart data={series} fill="#64748b" />
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top pages</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {paths.map((p) => (
                <li key={p.path ?? ""} className="flex justify-between gap-4">
                  <span className="truncate text-slate-600">{p.path}</span>
                  <span className="shrink-0 font-semibold">{p.c}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {refs.map((p) => (
                <li key={p.referrer ?? ""} className="flex justify-between gap-4">
                  <span className="truncate text-slate-600">{p.referrer}</span>
                  <span className="shrink-0 font-semibold">{p.c}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {countries.map((p) => (
                <li key={p.country ?? ""} className="flex justify-between">
                  <span>{p.country}</span>
                  <span className="font-semibold">{p.c}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Devices (pageviews)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {devices.map(([d, n]) => (
                <li key={d} className="flex justify-between">
                  <span className="capitalize">{d}</span>
                  <span className="font-semibold">{n}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
