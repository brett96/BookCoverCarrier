import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSiteSetting } from "@/lib/site-settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const lastEmailError = await getSiteSetting("last_email_error");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <SettingsForm lastEmailError={lastEmailError} />
    </div>
  );
}
