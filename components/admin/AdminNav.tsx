"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/traffic", label: "Traffic" },
  { href: "/admin/engagement", label: "Engagement" },
  { href: "/admin/funnel", label: "Funnel" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <aside className="flex w-56 flex-col border-r border-slate-200 bg-slate-50 p-4">
      <div className="mb-8 font-bold text-slate-900">BookCover Admin</div>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white",
              pathname === href && "bg-white shadow-sm"
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
        Sign out
      </Button>
    </aside>
  );
}
