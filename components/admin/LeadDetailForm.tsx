"use client";

import { useFormState } from "react-dom";
import type { Lead } from "@/lib/db/schema";
import { updateLead } from "@/lib/actions/update-lead";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export function LeadDetailForm({ lead }: { lead: Lead }) {
  const [status, setStatus] = useState(lead.status);
  const [state, action] = useFormState(updateLead, undefined);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={lead.id} />
      <input type="hidden" name="status" value={status} />
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <div>
          <span className="font-semibold text-slate-700">Organization: </span>
          {lead.organization}
        </div>
        <div>
          <span className="font-semibold text-slate-700">Email: </span>
          {lead.email}
        </div>
        <div>
          <span className="font-semibold text-slate-700">Phone: </span>
          {lead.phone ?? "—"}
        </div>
        <div>
          <span className="font-semibold text-slate-700">Title: </span>
          {lead.title}
        </div>
        <div>
          <span className="font-semibold text-slate-700">Preferred: </span>
          {lead.preferredDate} · {lead.preferredTime} · {lead.timezone}
        </div>
        <div>
          <span className="font-semibold text-slate-700">Referrer / UTM: </span>
          {lead.referrer ?? "—"} / {(lead.utmSource ?? "") + " " + (lead.utmMedium ?? "")}
        </div>
        <div>
          <span className="font-semibold text-slate-700">Visitor ID: </span>
          {lead.visitorId ?? "—"}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["new", "contacted", "qualified", "disqualified", "won"].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Internal notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={lead.notes ?? ""}
          rows={5}
          placeholder="Notes visible only in admin…"
        />
      </div>
      {state?.ok === false && state.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
      {state?.ok === true && <p className="text-sm text-green-700">Saved.</p>}
      <Button type="submit">Save changes</Button>
    </form>
  );
}
