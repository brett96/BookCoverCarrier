import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;
  if (session?.user) {
    redirect(sp.callbackUrl ?? "/admin");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <LoginForm callbackUrl={sp.callbackUrl ?? "/admin"} />
    </div>
  );
}
