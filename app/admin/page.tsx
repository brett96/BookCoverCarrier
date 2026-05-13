import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/client";
import {
  ctaLeaderboard,
  distinctVisitors,
  distinctVisitorsToday,
  funnelCounts,
  leadsCountSince,
  pageviewsByDay,
  recentLeads,
  scrollDepthAvg,
  topCities,
  topReferrers,
} from "@/lib/analytics";
import { decodeGeo } from "@/lib/format-date";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VisitorsAreaChart } from "@/components/admin/VisitorsAreaChart";
import Link from "next/link";

export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const db = getDb();
  if (!db) {
    return (
      <p className="text-slate-600">
        Connect <code className="rounded bg-slate-100 px-1">DATABASE_URL</code>{" "}
        to see analytics.
      </p>
    );
  }

  const [
    vToday,
    v7,
    v30,
    leads30,
    funnel,
    series,
    ctas,
    scroll,
    referrers,
    cities,
  ] = await Promise.all([
    distinctVisitorsToday(db),
    distinctVisitors(db, 7),
    distinctVisitors(db, 30),
    leadsCountSince(db, 30),
    funnelCounts(db, 30),
    pageviewsByDay(db, 30),
    ctaLeaderboard(db, 30),
    scrollDepthAvg(db, 30),
    topReferrers(db, 30, 6),
    topCities(db, 30, 8),
  ]);
  const leads = await recentLeads(db, 6);
  const conv =
    funnel.pageview > 0
      ? ((funnel.form_submit / funnel.pageview) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Visitors (today PT)</CardDescription>
            <CardTitle className="text-3xl">{vToday}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Visitors (7d)</CardDescription>
            <CardTitle className="text-3xl">{v7}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Visitors (30d)</CardDescription>
            <CardTitle className="text-3xl">{v30}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Leads (30d)</CardDescription>
            <CardTitle className="text-3xl">{leads30}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Form conversion (30d)</CardDescription>
            <CardTitle className="text-3xl">{conv}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg scroll % (30d)</CardDescription>
            <CardTitle className="text-3xl">{scroll}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visitors by day</CardTitle>
          <CardDescription>Distinct visitors from pageviews</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <VisitorsAreaChart data={series} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CTA clicks (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {ctas.map(([loc, n]) => (
                <li key={loc} className="flex justify-between">
                  <span className="text-slate-600">{loc}</span>
                  <span className="font-semibold">{n}</span>
                </li>
              ))}
              {!ctas.length && (
                <li className="text-slate-500">No CTA events yet.</li>
              )}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Funnel (30d, distinct visitors)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {Object.entries(funnel).map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span className="text-slate-600">{k}</span>
                  <span className="font-semibold">{v}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top referrers (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {referrers.map((r) => (
                <li key={r.referrer ?? ""} className="flex justify-between gap-2">
                  <span className="truncate text-slate-600">{r.referrer}</span>
                  <span className="shrink-0 font-semibold">{r.c}</span>
                </li>
              ))}
              {!referrers.length && (
                <li className="text-slate-500">No referrer data yet.</li>
              )}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top cities (30d)</CardTitle>
            <CardDescription>
              <Link
                href="/admin/traffic"
                className="text-blue-600 hover:underline"
              >
                View all
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {cities.map((c) => (
                <li
                  key={`${c.city ?? ""}-${c.region ?? ""}-${c.country ?? ""}`}
                  className="flex justify-between gap-4"
                >
                  <span className="truncate text-slate-600">
                    {decodeGeo(c.city)}
                    {c.region || c.country ? (
                      <span className="text-slate-400">
                        {" · "}
                        {[decodeGeo(c.region), c.country]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-semibold">{c.c}</span>
                </li>
              ))}
              {!cities.length && (
                <li className="text-slate-500">No city data yet.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent leads</CardTitle>
          <CardDescription>
            <Link href="/admin/leads" className="text-blue-600 hover:underline">
              View all
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-slate-100 text-sm">
            {leads.map((l) => (
              <li key={l.id} className="flex justify-between py-2">
                <Link
                  href={`/admin/leads/${l.id}`}
                  className="font-medium text-blue-700 hover:underline"
                >
                  {l.firstName} {l.lastName}
                </Link>
                <span className="text-slate-500">{l.organization}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
