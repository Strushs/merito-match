import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SwipeDeck from "./swipe-deck";

export default async function BrowsePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  // Fetch my profile to ensure it exists and get my INTENT
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, intent")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return redirect("/onboarding");
  }

  // Fetch my likes to exclude them
  const { data: myLikes } = await supabase
    .from("likes")
    .select("to_user")
    .eq("from_user", user.id);

  // Fetch users I have blocked
  const { data: iBlocked } = await supabase
    .from("blocked_users")
    .select("blocked_id")
    .eq("blocker_id", user.id);

  // Fetch users who blocked me
  const { data: blockedMe } = await supabase
    .from("blocked_users")
    .select("blocker_id")
    .eq("blocked_id", user.id);

  const excludedIds = new Set<string>();
  excludedIds.add(user.id); // Exclude self
  myLikes?.forEach((l) => excludedIds.add(l.to_user));
  iBlocked?.forEach((b) => excludedIds.add(b.blocked_id));
  blockedMe?.forEach((b) => excludedIds.add(b.blocker_id));

  // Fetch potential candidates, filtering by intent and excluding already liked/self/blocked
  // We cannot easily do "NOT IN" array in Supabase JS simply without stored procedure for large sets,
  // but we can slice client side or use .not('id', 'in', `(${excludedIds.join(',')})`)

  // Filter by Intent
  let query = supabase
    .from("profiles")
    .select("*")
    .eq("intent", profile.intent); // MATCHING LOGIC: Same Intent

  if (excludedIds.size > 0) {
    // Array.from to convert Set to Array
    const excludedArray = Array.from(excludedIds);
    // Batch if too many, but for now assumption is prototype scale
    query = query.not("id", "in", `(${excludedArray.join(",")})`);
  }

  const { data: candidates, error } = await query.limit(20);

  if (error) {
    console.error(error);
  }

  return (
    <div className="h-full flex flex-col">
      {/* Mobile Header for Title Context? 
           Actually DashboardNav covers basic nav.
           Let's just put a subtle page title. 
       */}
      <div className="md:hidden pb-4 pt-10 px-4">
        <h1 className="text-2xl font-bold text-primary">Finderito</h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <SwipeDeck initialCandidates={candidates || []} />
      </div>
    </div>
  );
}
