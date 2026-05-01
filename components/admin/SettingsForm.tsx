"use client";

import { useState } from "react";
import { changePassword } from "@/lib/actions/change-password";
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

export function SettingsForm({ lastEmailError }: { lastEmailError: string | null }) {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function onPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setErr("");
    const fd = new FormData(e.currentTarget);
    const res = await changePassword(fd);
    if (res.ok) {
      setMsg("Password updated.");
      e.currentTarget.reset();
    } else {
      setErr(res.message ?? "Error");
    }
  }

  return (
    <div className="max-w-lg space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Email delivery</CardTitle>
          <CardDescription>
            Last SMTP error (cleared on successful send). Check Gmail App Password
            and env vars on Vercel if set.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-md bg-slate-100 p-3 text-xs text-slate-800">
            {lastEmailError || "— No errors recorded —"}
          </pre>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
              />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            {msg && <p className="text-sm text-green-700">{msg}</p>}
            <Button type="submit">Update password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
