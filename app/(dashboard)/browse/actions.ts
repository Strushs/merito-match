"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function likeUser(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Check if target already liked us
  const { data: likedBack } = await supabase
    .from("likes")
    .select("*")
    .eq("from_user", targetUserId)
    .eq("to_user", user.id)
    .single();

  if (likedBack) {
    // IT'S A MATCH!
    // Create match record
    const { data: match, error } = await supabase
      .from("matches")
      .insert({
        user_a: user.id,
        user_b: targetUserId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating match:", error);
      throw error;
    }

    // Also record the like for completeness (optional, but good for history)
    await supabase.from("likes").insert({
      from_user: user.id,
      to_user: targetUserId,
      status: "accepted",
    });

    // Update the other user's like status to accepted (optional)

    revalidatePath("/browse");
    revalidatePath("/chat");
    return { isMatch: true, matchId: match.id };
  } else {
    // Just a like
    const { error } = await supabase.from("likes").insert({
      from_user: user.id,
      to_user: targetUserId,
      status: "pending",
    });

    if (error) {
      // If unique constraint violation, means we already liked them. Ignore.
      if (error.code !== "23505") {
        console.error("Error creating like:", error);
        throw error;
      }
    }

    revalidatePath("/browse");
    return { isMatch: false, matchId: null };
  }
}

export async function passUser(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("likes").insert({
    from_user: user.id,
    to_user: targetUserId,
    status: "rejected",
  });

  revalidatePath("/browse");
}
