"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { requestPasswordReset } from "@/lib/actions/request-password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Notice =
  | { kind: "error"; message: string }
  | { kind: "info"; message: string }
  | { kind: "success"; message: string };

const GENERIC_RESET_NOTICE =
  "If a password reset is available for this account, an email with a one-time link has been sent. The link expires in 60 minutes.";

export function LoginForm({
  callbackUrl,
  initialNotice,
}: {
  callbackUrl: string;
  initialNotice?: Notice | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<Notice | null>(initialNotice ?? null);
  const [loading, setLoading] = useState(false);
  const [resetPending, startResetTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setNotice({ kind: "error", message: "Invalid email or password." });
      return;
    }
    window.location.href = res?.url ?? callbackUrl;
  }

  function onRequestReset() {
    setNotice(null);
    startResetTransition(async () => {
      try {
        await requestPasswordReset();
      } catch {
        // Even if the action throws, surface the same generic message — we
        // intentionally do not reveal whether the underlying send succeeded.
      }
      setNotice({ kind: "info", message: GENERIC_RESET_NOTICE });
    });
  }

  const noticeColor =
    notice?.kind === "error"
      ? "text-red-600"
      : notice?.kind === "success"
        ? "text-green-700"
        : "text-slate-600";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>BookCover Admin</CardTitle>
        <CardDescription>Sign in to view analytics and leads.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {notice && (
            <p className={`text-sm ${noticeColor}`}>{notice.message}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <div className="border-t border-slate-100 pt-3 text-center">
            <button
              type="button"
              onClick={onRequestReset}
              disabled={resetPending}
              className="text-sm font-medium text-blue-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {resetPending ? "Sending reset link…" : "Reset password"}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
