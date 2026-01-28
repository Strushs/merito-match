import DashboardNav from "@/components/dashboard-nav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  // Check Ban Status & Admin Status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned, is_admin")
    .eq("id", user.id)
    .single();

  if (profile?.is_banned) {
    redirect("/banned");
  }

  return (
    <div className="min-h-screen bg-muted/5 dark:bg-background">
      <DashboardNav isAdmin={profile?.is_admin} />
      {/* 
        Desktop: ml-64 (Sidebar width) 
        Mobile: mb-16 (Bottom nav height) 
      */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">{children}</main>
    </div>
  );
}
