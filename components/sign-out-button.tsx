"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleSignOut}
      title="Sign Out"
    >
      <LogOut className="h-5 w-5" />
    </Button>
  );
}
