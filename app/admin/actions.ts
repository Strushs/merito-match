"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Verification Helper
async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_admin) {
    redirect("/chat"); // Or basic unauthorized page
  }

  return { supabase, user };
}

export type ReportData = {
  id: number;
  created_at: string;
  reason: string;
  description: string | null;
  status: "pending" | "reviewed" | "resolved";
  chat_transcript: string | null;
  reporter: { nickname: string | null; email: string | null; id: string };
  accused: {
    nickname: string | null;
    email: string | null;
    id: string;
    is_banned: boolean | null;
  };
};

export async function getReports(): Promise<ReportData[]> {
  const { supabase } = await verifyAdmin();

  // Fetch reports with related profiles
  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      created_at,
      reason,
      description,
      status,
      chat_transcript,
      reporter:profiles!reporter_id(id, nickname, email),
      accused:profiles!accused_id(id, nickname, email, is_banned)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reports:", error);
    throw new Error("Failed to fetch reports");
  }

  // Cast because Supabase types might be loosely defined for deep joins without stricter generation
  return data as unknown as ReportData[];
}

export async function dismissReport(reportId: number) {
  const { supabase } = await verifyAdmin();

  const { error } = await supabase.from("reports").delete().eq("id", reportId);

  if (error) {
    console.error("Error dismissing report:", error);
    throw error;
  }

  revalidatePath("/admin");
}

export async function resolveReport(reportId: number) {
  const { supabase } = await verifyAdmin();

  const { error } = await supabase
    .from("reports")
    .update({ status: "resolved" })
    .eq("id", reportId);

  if (error) {
    console.error("Error resolving report:", error);
    throw error;
  }

  revalidatePath("/admin");
}

export async function banUser(userId: string) {
  const { supabase } = await verifyAdmin();

  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: true })
    .eq("id", userId);

  if (error) {
    console.error("Error banning user:", error);
    throw error;
  }

  revalidatePath("/admin");
}
