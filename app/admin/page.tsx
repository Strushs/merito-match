import { getReports } from "./actions";
import ReportList from "./report-list";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const reports = await getReports();

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage reports and moderate user activity.
          </p>
        </div>
        <Link href="/browse" className={buttonVariants({ variant: "ghost" })}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to App
        </Link>
      </div>

      <ReportList initialReports={reports} />
    </div>
  );
}
