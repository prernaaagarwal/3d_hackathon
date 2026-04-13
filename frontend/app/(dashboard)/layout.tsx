import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-navy-950">
      <DashboardSidebar />
      <main className="ml-64 min-h-screen px-8 py-8">{children}</main>
    </div>
  );
}

