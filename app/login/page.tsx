"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialView =
    searchParams.get("view") === "signup" ? "signup" : "login";

  const [view, setView] = useState<"login" | "signup">(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get("confirmed") === "true") {
      toast.success("Email confirmed! You can now log in.");
    }
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email.endsWith("@student.gdansk.merito.pl")) {
      toast.error(
        "Access restricted to @student.gdansk.merito.pl emails only.",
      );
      setLoading(false);
      return;
    }

    if (view === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        setShowConfirmModal(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
      } else {
        router.refresh();
        router.push("/browse");
      }
    }
    setLoading(false);
  };

  return (
    <>
      <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 dark:bg-black/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl text-primary font-bold tracking-tight">
            {view === "login" ? "Welcome Back" : "Join Finderito"}
          </CardTitle>
          <CardDescription className="text-base">
            {view === "login"
              ? "Enter your credentials to access your account"
              : "Create an account to start matching"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Student Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="index@student.gdansk.merito.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 bg-background/50"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 font-bold text-lg shadow-md hover:shadow-lg transition-all"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : view === "login" ? (
                "Log In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pb-8 pt-0">
          <Button
            variant="link"
            onClick={() => setView(view === "login" ? "signup" : "login")}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {view === "login"
              ? "Don't have an account? Sign Up"
              : "Already have an account? Log In"}
          </Button>
        </CardFooter>
      </Card>

      {/* Email Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl bg-white/95 dark:bg-black/80 backdrop-blur-sm">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl text-primary font-bold">
              Check Your Email
            </DialogTitle>
            <DialogDescription className="text-base space-y-3">
              <p>
                We&apos;ve sent a verification link to{" "}
                <strong className="text-foreground">{email}</strong>
              </p>
              <p>
                Open <strong>Outlook</strong> and click the confirmation link in
                the email to activate your account.
              </p>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-left">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                <p className="text-sm text-yellow-200">
                  <strong>Don&apos;t see the email?</strong> Check your{" "}
                  <strong>Spam / Junk</strong> folder — the message may have
                  landed there.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center pt-2">
            <Button
              className="w-full font-bold"
              onClick={() => {
                setShowConfirmModal(false);
                setView("login");
              }}
            >
              Got it, I&apos;ll check my email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4 relative overflow-hidden">
      <Suspense
        fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
