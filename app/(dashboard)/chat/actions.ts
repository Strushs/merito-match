"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markMessagesAsRead(matchId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Determine if I am user_a or user_b
  const { data: match } = await supabase
    .from("matches")
    .select("user_a, user_b")
    .eq("id", matchId)
    .single();

  if (!match) return;

  const updateField =
    match.user_a === user.id ? "user_a_last_read" : "user_b_last_read";
  console.log(
    `Marking read for match ${matchId} as user ${user.id} (${updateField})`,
  );

  const { error } = await supabase
    .from("matches")
    .update({ [updateField]: new Date().toISOString() })
    .eq("id", matchId);

  if (error) console.error("Error marking read:", error);

  revalidatePath("/chat");
}
