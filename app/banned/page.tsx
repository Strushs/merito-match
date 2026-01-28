import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function BannedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in, why are you here? Go login.
  if (!user) {
    redirect("/login");
  }

  // Double check if actually banned (avoid stuck users if unbanned)
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .single();

  if (!profile?.is_banned) {
    redirect("/browse");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/10 text-center space-y-6">
      <div className="bg-destructive/10 p-6 rounded-full">
        <ShieldAlert className="w-16 h-16 text-destructive" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">Account Suspended</h1>
        <p className="text-muted-foreground">
          Your account has been flagged for violating our Community Guidelines.
          Access to MeritoMatch is currently revoked.
        </p>
      </div>

      <div className="text-sm p-4 border rounded-md bg-background max-w-sm">
        <p className="font-semibold mb-1">Think this is a mistake?</p>
        <p className="text-muted-foreground">
          Contact our support team at <br />
          <a
            href="mailto:support@merito-match.pl"
            className="text-primary hover:underline"
          >
            support@merito-match.pl
          </a>
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          const supabase = await createClient();
          await supabase.auth.signOut();
          redirect("/login");
        }}
      >
        <Button variant="outline">Sign Out</Button>
      </form>
    </div>
  );
}
