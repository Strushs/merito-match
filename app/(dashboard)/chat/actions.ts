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

export async function unmatchUser(matchId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Verify participation
  const { data: match } = await supabase
    .from("matches")
    .select("user_a, user_b")
    .eq("id", matchId)
    .single();

  if (!match) throw new Error("Match not found");
  if (match.user_a !== user.id && match.user_b !== user.id) {
    throw new Error("Not authorized");
  }

  const blockedId = match.user_a === user.id ? match.user_b : match.user_a;

  // 1. Block the user
  const { error: blockError } = await supabase.from("blocked_users").insert({
    blocker_id: user.id,
    blocked_id: blockedId,
  });

  if (blockError) {
    console.error("Error blocking user during unmatch:", blockError);
    // Proceed anyway to ensure unmatch happens? Or fail?
    // Failing is safer to ensure block is recorded.
    throw blockError;
  }

  // 2. Delete all messages (Manual cascade)
  await supabase.from("messages").delete().eq("match_id", matchId);

  // 3. Delete the match (Hard Delete)
  const { error } = await supabase.from("matches").delete().eq("id", matchId);

  if (error) {
    console.error("Error unmatching:", error);
    throw error;
  }

  revalidatePath("/chat");
  revalidatePath("/browse");
}

async function getChatTranscript(
  supabase: ReturnType<typeof createClient> extends Promise<infer T>
    ? T
    : never,
  matchId: number,
) {
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("created_at, content, sender_id")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("Error fetching messages for transcript:", messagesError);
    return "Error fetching messages.";
  }

  if (!messages || messages.length === 0) return "No messages found.";

  // Get unique sender IDs
  const senderIds = Array.from(new Set(messages.map((m) => m.sender_id)));

  // Fetch emails from auth.users using our database function
  const emailMap = new Map<string, string>();
  for (const senderId of senderIds) {
    const { data: email } = await supabase.rpc("get_user_email", {
      user_id: senderId,
    });
    if (email) {
      emailMap.set(senderId, email);
    }
  }

  return messages
    .map((m) => {
      const email =
        emailMap.get(m.sender_id) || `User ${m.sender_id.slice(0, 8)}...`;
      return `${email}:${m.content}`;
    })
    .join("\n");
}

export async function submitReport(
  matchId: number,
  reason: string,
  description: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Get match to find accused_id
  const { data: match } = await supabase
    .from("matches")
    .select("user_a, user_b")
    .eq("id", matchId)
    .single();

  if (!match) throw new Error("Match not found");

  const accusedId = match.user_a === user.id ? match.user_b : match.user_a;

  // 1. Generate Chat Transcript
  const chatTranscript = await getChatTranscript(supabase, matchId);

  // 2. Create report with transcript
  const { error: reportError } = await supabase.from("reports").insert({
    reporter_id: user.id,
    accused_id: accusedId,
    match_id: matchId,
    reason,
    description,
    chat_transcript: chatTranscript,
  });

  if (reportError) {
    console.error("Error reporting:", reportError);
    throw reportError;
  }

  // 3. Block the user
  const { error: blockError } = await supabase.from("blocked_users").insert({
    blocker_id: user.id,
    blocked_id: accusedId,
  });

  if (blockError) {
    console.error("Error blocking user during report:", blockError);
  }

  // 4. Archive Complete: Delete Original Data (Cleanup)
  // Delete all messages
  await supabase.from("messages").delete().eq("match_id", matchId);

  // Delete the match
  await supabase.from("matches").delete().eq("id", matchId);

  revalidatePath("/chat");
  return { success: true };
}
