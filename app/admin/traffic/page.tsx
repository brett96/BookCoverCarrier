import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/client";
import {
  pageviewsByDay,
  topCountries,
  topPaths,
  topReferrers,
  topRegions,
  topCities,
  topIps,
  recentVisits,
  deviceBreakdown,
} from "@/lib/analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VisitorsAreaChart } from "@/components/admin/VisitorsAreaChart";

function formatLocation(
  city?: string | null,
  region?: string | null,
  country?: string | null
) {
  const parts = [city, region, country].filter(Boolean) as string[];
  return parts.length ? parts.join(", ") : "—";
}

function formatTimestamp(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function formatRelative(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

function shortenUa(deviceType?: string | null, browser?: string | null, os?: string | null) {
  const parts = [
    deviceType && deviceType !== "desktop" ? deviceType : null,
    browser || null,
    os || null,
  ].filter(Boolean) as string[];
  return parts.length ? parts.join(" · ") : "—";
}

export default async function TrafficPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const db = getDb();
  if (!db) {
    return <p className="text-slate-600">Database not configured.</p>;
  }
  const [
    series,
    paths,
    refs,
    countries,
    regions,
    cities,
    ips,
    visits,
    devices,
  ] = await Promise.all([
    pageviewsByDay(db, 30),
    topPaths(db, 30, 12),
    topReferrers(db, 30, 12),
    topCountries(db, 30, 12),
    topRegions(db, 30, 12),
    topCities(db, 30, 12),
    topIps(db, 30, 20),
    recentVisits(db, 50),
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
              {paths.length === 0 && (
                <li className="text-slate-400">No data yet.</li>
              )}
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
              {refs.length === 0 && (
                <li className="text-slate-400">No data yet.</li>
              )}
              {refs.map((p) => (
                <li
                  key={p.referrer ?? ""}
                  className="flex justify-between gap-4"
                >
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
            <CardTitle>Top regions / states</CardTitle>
            <CardDescription>By pageviews · last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {regions.length === 0 && (
                <li className="text-slate-400">No data yet.</li>
              )}
              {regions.map((r) => (
                <li
                  key={`${r.region ?? ""}-${r.country ?? ""}`}
                  className="flex justify-between gap-4"
                >
                  <span className="truncate text-slate-600">
                    {r.region}
                    {r.country ? (
                      <span className="text-slate-400"> · {r.country}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-semibold">{r.c}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top cities</CardTitle>
            <CardDescription>By pageviews · last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {cities.length === 0 && (
                <li className="text-slate-400">No data yet.</li>
              )}
              {cities.map((c) => (
                <li
                  key={`${c.city ?? ""}-${c.region ?? ""}-${c.country ?? ""}`}
                  className="flex justify-between gap-4"
                >
                  <span className="truncate text-slate-600">
                    {c.city}
                    {c.region || c.country ? (
                      <span className="text-slate-400">
                        {" · "}
                        {[c.region, c.country].filter(Boolean).join(", ")}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-semibold">{c.c}</span>
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
              {countries.length === 0 && (
                <li className="text-slate-400">No data yet.</li>
              )}
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
              {devices.length === 0 && (
                <li className="text-slate-400">No data yet.</li>
              )}
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

      <Card>
        <CardHeader>
          <CardTitle>Top IPs</CardTitle>
          <CardDescription>
            Most active client IPs and the location Vercel inferred for them ·
            last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {ips.length === 0 ? (
            <p className="px-6 text-sm text-slate-400">No IP data yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                  <TableHead>Last seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ips.map((row) => (
                  <TableRow key={`${row.ip ?? ""}-${row.city ?? ""}`}>
                    <TableCell className="font-mono text-xs text-slate-700">
                      {row.ip ?? "—"}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatLocation(row.city, row.region, row.country)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {row.visits}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatRelative(row.lastSeen)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent visits</CardTitle>
          <CardDescription>
            Last 50 pageviews with IP, location, and device. UTC timestamps.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {visits.length === 0 ? (
            <p className="px-6 text-sm text-slate-400">No visits yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Visitor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((v, i) => (
                  <TableRow key={`${v.occurredAt?.toString() ?? ""}-${i}`}>
                    <TableCell className="whitespace-nowrap text-xs text-slate-500">
                      {formatTimestamp(v.occurredAt)}
                    </TableCell>
                    <TableCell
                      className="max-w-[16rem] truncate text-slate-700"
                      title={v.path ?? ""}
                    >
                      {v.path ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">
                      {v.ip ?? "—"}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatLocation(v.city, v.region, v.country)}
                    </TableCell>
                    <TableCell
                      className="text-xs text-slate-500"
                      title={v.userAgent ?? undefined}
                    >
                      {shortenUa(v.deviceType, v.browser, v.os)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-400">
                      {v.visitorId ? v.visitorId.slice(0, 8) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
