import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <AdminNav />
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
