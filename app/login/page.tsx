import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; reset?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;
  if (session?.user) {
    redirect(sp.callbackUrl ?? "/admin");
  }
  const initialNotice =
    sp.reset === "success"
      ? {
          kind: "success" as const,
          message:
            "Your password has been updated. Sign in with the new password.",
        }
      : null;
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <LoginForm
        callbackUrl={sp.callbackUrl ?? "/admin"}
        initialNotice={initialNotice}
      />
    </div>
  );
}
