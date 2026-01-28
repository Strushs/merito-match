"use client";

import { useState } from "react";
import { ReportData, dismissReport, resolveReport, banUser } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ShieldAlert,
  Trash2,
  Eye,
  Ban,
  CheckCircle,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type FilterStatus = "all" | "pending" | "resolved";

export default function ReportList({
  initialReports,
}: {
  initialReports: ReportData[];
}) {
  const [reports, setReports] = useState<ReportData[]>(initialReports);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");

  // Filter reports
  const filteredReports = reports.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  // Optimistic UI updates helper
  const updateReportStatus = (id: number, status: "resolved") => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const removeReport = (id: number) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const handleResolve = async (id: number) => {
    // Optimistic update
    const original = [...reports];
    updateReportStatus(id, "resolved");

    try {
      await resolveReport(id);
      toast.success("Report marked as resolved");
    } catch (e) {
      setReports(original); // Revert
      toast.error("Failed to resolve report");
    }
  };

  const handleDismiss = async (id: number) => {
    if (!confirm("Permanently DELETE this report logic?")) return;

    // Optimistic remove
    const original = [...reports];
    removeReport(id);

    try {
      await dismissReport(id);
      toast.success("Report deleted");
    } catch (e) {
      setReports(original); // Revert
      toast.error("Failed to delete report");
    }
  };

  const handleBan = async (report: ReportData) => {
    if (!confirm(`Permanently BAN user ${report.accused.email}?`)) return;

    setIsProcessing(true);
    try {
      await banUser(report.accused.id);
      toast.success(`User ${report.accused.email} has been BANNED.`);
    } catch (e) {
      toast.error("Failed to ban user");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex gap-2 pb-2 border-b">
        <Button
          variant={filterStatus === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("pending")}
        >
          Pending
        </Button>
        <Button
          variant={filterStatus === "resolved" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("resolved")}
        >
          Resolved
        </Button>
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("all")}
        >
          All
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr className="text-left">
              <th className="p-4 font-medium text-muted-foreground w-[100px]">
                Date
              </th>
              <th className="p-4 font-medium text-muted-foreground">Status</th>
              <th className="p-4 font-medium text-muted-foreground">Reason</th>
              <th className="p-4 font-medium text-muted-foreground">
                Reporter
              </th>
              <th className="p-4 font-medium text-muted-foreground">Accused</th>
              <th className="p-4 font-medium text-muted-foreground text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-muted-foreground"
                >
                  No {filterStatus} reports found.
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr
                  key={report.id}
                  className={`border-b hover:bg-muted/50 transition-colors ${report.status === "resolved" ? "bg-muted/20 opacity-70" : ""}`}
                >
                  <td className="p-4 align-top">
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 align-top">
                    <Badge
                      variant={
                        report.status === "resolved" ? "outline" : "destructive"
                      }
                    >
                      {report.status}
                    </Badge>
                  </td>
                  <td className="p-4 align-top max-w-[200px]">
                    <div className="font-semibold">{report.reason}</div>
                    <div
                      className="text-muted-foreground truncate"
                      title={report.description || ""}
                    >
                      {report.description}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="font-medium">
                      {report.reporter?.nickname || "Unknown"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {report.reporter?.email}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="font-medium flex items-center gap-2">
                      {report.accused?.nickname || "Unknown"}
                      {report.accused?.is_banned && (
                        <span className="text-xs bg-destructive/10 text-destructive px-1 rounded">
                          BANNED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {report.accused?.email}
                    </div>
                  </td>
                  <td className="p-4 align-top text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedReport(report)}
                      title="View Evidence"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {report.status !== "resolved" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleResolve(report.id)}
                        title="Mark Resolved"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!!report.accused?.is_banned || isProcessing}
                      onClick={() => handleBan(report)}
                      title="Ban User"
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border rounded-md">
            No {filterStatus} reports found.
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className={`border rounded-lg p-4 space-y-3 ${report.status === "resolved" ? "bg-muted/20 opacity-70" : ""}`}
            >
              <div className="flex justify-between items-start">
                <Badge
                  variant={
                    report.status === "resolved" ? "outline" : "destructive"
                  }
                >
                  {report.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>

              <div>
                <div className="font-semibold">{report.reason}</div>
                <div className="text-sm text-muted-foreground">
                  {report.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-2 rounded">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Reporter
                  </div>
                  <div className="font-medium">
                    {report.reporter?.nickname || "Unknown"}
                  </div>
                  <div className="text-[10px] text-muted-foreground break-all">
                    {report.reporter?.email}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Accused
                  </div>
                  <div className="font-medium flex items-center gap-1">
                    {report.accused?.nickname || "Unknown"}
                    {report.accused?.is_banned && (
                      <span className="text-[9px] bg-destructive/10 text-destructive px-1 rounded">
                        BAN
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground break-all">
                    {report.accused?.email}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedReport(report)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" /> Evidence
                </Button>

                {report.status !== "resolved" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleResolve(report.id)}
                    className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Resolve
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!!report.accused?.is_banned || isProcessing}
                  onClick={() => handleBan(report)}
                  className="flex-1"
                >
                  <Ban className="w-4 h-4 mr-2" /> Ban
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Evidence Dialog */}
      <Dialog
        open={!!selectedReport}
        onOpenChange={(open) => !open && setSelectedReport(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Report Evidence</DialogTitle>
            <DialogDescription>
              Review the chat transcript between{" "}
              {selectedReport?.reporter?.nickname} and{" "}
              {selectedReport?.accused?.nickname}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 bg-muted/30 rounded-md border text-sm font-mono whitespace-pre-wrap">
            {selectedReport?.chat_transcript || "No transcript available."}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
