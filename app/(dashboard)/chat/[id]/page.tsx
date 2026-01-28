import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatWindow from "./chat-window";
import Link from "next/link";

// Correctly typing params for Next.js 15+ (Params is a Promise now, but in 14 it's sync/awaitable depending on version)
// Assuming Next.js 14 based on prompt "Next.js 14+".
// Update: As of very recent Next.js versions params must be awaited in async components sometimes,
// but standard generic type Props = { params: { id: string } } works for Page.

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ChatPage({ params }: Props) {
  // NEXT 15+: Params must be awaited
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  // Verify user is a participant in this match
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, user_a, user_b")
    .eq("id", id)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .single();

  if (matchError || !match) {
    // User is not a participant in this chat or match doesn't exist
    console.log("Chat access denied:", {
      matchId: id,
      userId: user.id,
      error: matchError,
    });
    return redirect("/chat");
  }

  const PAGE_SIZE = 50;

  // Fetch total count to determine if there are older messages
  const { count: totalCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("match_id", id);

  // Fetch the last PAGE_SIZE messages (most recent)
  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", id)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  // Reverse to show oldest first in the UI
  const orderedMessages = messages?.reverse() || [];
  const hasMoreMessages = (totalCount || 0) > PAGE_SIZE;

  if (error) {
    console.error("Chat Load Error:", error);
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center p-4">
        <h3 className="text-xl font-bold text-destructive">Chat Error</h3>
        <p className="text-muted-foreground">{error.message}</p>
        <Link href="/chat" className="mt-4 text-primary hover:underline">
          Return to Matches
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-background flex flex-col md:static md:z-auto md:h-screen pt-[16.5px] pb-[24px] overflow-hidden border-b-0">
      <div className="flex-1 overflow-hidden">
        <ChatWindow
          matchId={id}
          initialMessages={orderedMessages}
          currentUserId={user.id}
          hasMoreMessages={hasMoreMessages}
        />
      </div>
    </div>
  );
}
