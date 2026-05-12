import { createHash } from "node:crypto";
import Link from "next/link";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { passwordResetTokens } from "@/lib/db/schema";
import { ResetPasswordForm } from "@/components/admin/ResetPasswordForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token?.trim() ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      {await renderContent(token)}
    </div>
  );
}

async function renderContent(token: string) {
  if (!token) {
    return <InvalidLink />;
  }

  const db = getDb();
  if (!db) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset unavailable</CardTitle>
          <CardDescription>
            The database isn&apos;t configured for this environment. Contact
            the site administrator.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [row] = await db
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!row) {
    return <InvalidLink />;
  }

  return <ResetPasswordForm token={token} />;
}

function InvalidLink() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset link is invalid or expired</CardTitle>
        <CardDescription>
          Password reset links can only be used once and expire 60 minutes
          after being sent. Request a new link from the sign-in page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href="/login"
          className="text-sm font-semibold text-blue-700 hover:underline"
        >
          Back to sign-in
        </Link>
      </CardContent>
    </Card>
  );
}
