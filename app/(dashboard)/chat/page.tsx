import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import SignOutButton from "@/components/sign-out-button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic"; // Prevent caching of unread status

export default async function ChatListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  // Check profile existence
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) return redirect("/onboarding");

  // Fetch matches involving me
  // Using !user_a and !user_b to specify the foreign key column explicitly
  // Also fetching latest message to check for unread
  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      `
      id,
      user_a,
      user_b,
      user_a_last_read,
      user_b_last_read,
      participant_a:profiles!user_a(id, study_field, avatar_url, nickname),
      participant_b:profiles!user_b(id, study_field, avatar_url, nickname),
      last_msg:messages(created_at, sender_id)
    `,
    )
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(50); // Pagination limit

  if (error) {
    return (
      <div className="min-h-screen pt-20 p-4 text-center">
        <h2 className="text-xl font-bold text-destructive">
          Error loading matches
        </h2>
        <p className="text-muted-foreground">{error.message}</p>
        <p className="text-xs text-muted mt-2">
          Try refreshing or check database permissions.
        </p>
      </div>
    );
  }

  // Helper to get the OTHER user
  const getOtherProfile = (match: any) => {
    if (match.user_a === user.id) return match.participant_b;
    return match.participant_a;
  };

  return (
    <div className="max-w-4xl mx-auto md:p-8 p-4 pb-20">
      <div className="mb-6 pt-10 md:pt-0">
        <h1 className="text-3xl font-bold tracking-tight">Your Matches</h1>
        <p className="text-muted-foreground">
          Chat with students you've matched with.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(!matches || matches.length === 0) && (
          <div className="col-span-full text-center mt-20 text-muted-foreground">
            No matches yet. Go swipe some more!
          </div>
        )}
        {matches?.map((match) => {
          const other = getOtherProfile(match);
          if (!other || Array.isArray(other)) return null;

          // Unread Logic
          const myLastRead =
            match.user_a === user.id
              ? match.user_a_last_read
              : match.user_b_last_read;
          // Find latest message time from the array (if any)
          // Sorting desc by created_at in JS because Supabase inner sort is tricky
          const messages = Array.isArray(match.last_msg) ? match.last_msg : [];
          const latestMsg = messages.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )[0];

          // Only show unread if:
          // 1. There is a message
          // 2. It's newer than my read time
          // 3. I AM NOT THE SENDER (Crucial fix)
          const hasUnread =
            latestMsg &&
            latestMsg.sender_id !== user.id &&
            new Date(latestMsg.created_at) > new Date(myLastRead);

          if (hasUnread) {
            console.log(
              `Unread Match ${match.id}: MsgTime ${latestMsg.created_at} > ReadTime ${myLastRead}`,
            );
          }

          return (
            <Link key={match.id} href={`/chat/${match.id}`}>
              <Card
                className={cn(
                  "p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors relative",
                  hasUnread && "bg-primary/5 border-primary/20",
                )}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={other.avatar_url} />
                  <AvatarFallback>{other.study_field?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3
                      className={cn(
                        "font-semibold",
                        hasUnread && "text-primary",
                      )}
                    >
                      {other.nickname || other.study_field}
                    </h3>
                    {hasUnread && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-rose-950 bg-rose-100 rounded-full animate-pulse shadow-md">
                        ANSWER
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-sm",
                      hasUnread
                        ? "text-foreground font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    {other.study_field} • Tap to chat
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
