import DashboardNav from "@/components/dashboard-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/5 dark:bg-background">
      <DashboardNav />
      {/* 
        Desktop: ml-64 (Sidebar width) 
        Mobile: mb-16 (Bottom nav height) 
      */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">{children}</main>
    </div>
  );
}
