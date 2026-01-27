import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
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

  // Fetch Initial Messages
  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", id)
    .order("created_at", { ascending: true });

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
    <div className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-background flex flex-col md:static md:z-auto md:h-[calc(100vh-64px)] overflow-hidden border-b-0">
      <header className="h-16 border-b flex items-center px-4 bg-background/80 backdrop-blur z-50 shrink-0">
        <a href="/chat" className="text-sm font-medium hover:underline mr-4">
          ← Matches
        </a>
        <span className="font-semibold">Chat</span>
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatWindow
          matchId={id}
          initialMessages={messages || []}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
