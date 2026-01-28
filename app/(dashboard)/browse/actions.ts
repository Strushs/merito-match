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

    // Check if match already exists (the other user might have created it first)
    const { data: existingMatch } = await supabase
      .from("matches")
      .select("id")
      .or(
        `and(user_a.eq.${user.id},user_b.eq.${targetUserId}),and(user_a.eq.${targetUserId},user_b.eq.${user.id})`,
      )
      .single();

    if (existingMatch) {
      // Match already exists, return it
      revalidatePath("/chat");
      return { isMatch: true, matchId: existingMatch.id };
    }

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
      // If unique constraint violation, try to fetch existing match
      if (error.code === "23505") {
        const { data: foundMatch } = await supabase
          .from("matches")
          .select("id")
          .or(
            `and(user_a.eq.${user.id},user_b.eq.${targetUserId}),and(user_a.eq.${targetUserId},user_b.eq.${user.id})`,
          )
          .single();

        if (foundMatch) {
          revalidatePath("/chat");
          return { isMatch: true, matchId: foundMatch.id };
        }
      }
      throw error;
    }

    // Also record the like for completeness (optional, but good for history)
    await supabase.from("likes").insert({
      from_user: user.id,
      to_user: targetUserId,
      status: "accepted",
    });

    // Only revalidate /chat, NOT /browse - otherwise it resets client state
    revalidatePath("/chat");
    return { isMatch: true, matchId: match.id };
  } else {
    // Just a like
    const { error } = await supabase
      .from("likes")
      .insert({
        from_user: user.id,
        to_user: targetUserId,
        status: "pending",
      })
      .select();

    if (error) {
      // If unique constraint violation, means we already liked them. Ignore.
      if (error.code !== "23505") {
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
