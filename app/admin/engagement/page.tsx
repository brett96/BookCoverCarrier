import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/client";
import {
  ctaLeaderboard,
  scrollDepthAvg,
  tabViews,
} from "@/lib/analytics";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EngagementPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const db = getDb();
  if (!db) {
    return <p className="text-slate-600">Database not configured.</p>;
  }
  const [ctas, adminTabs, memberTabs, scroll] = await Promise.all([
    ctaLeaderboard(db, 30),
    tabViews(db, 30, "admin_demo"),
    tabViews(db, 30, "member_app"),
    scrollDepthAvg(db, 30),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Engagement</h1>
      <Card>
        <CardHeader>
          <CardTitle>CTA clicks by placement (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {ctas.map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span className="text-slate-600">{k}</span>
                <span className="font-semibold">{v}</span>
              </li>
            ))}
            {!ctas.length && (
              <li className="text-slate-500">No CTA events recorded yet.</li>
            )}
          </ul>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Admin demo tabs</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {adminTabs.map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span className="font-semibold">{v}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Member app tabs</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {memberTabs.map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span className="font-semibold">{v}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Scroll depth</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          Average percent recorded on scroll_depth events (last 30d):{" "}
          <strong className="text-slate-900">{scroll}%</strong>
        </CardContent>
      </Card>
    </div>
  );
}
