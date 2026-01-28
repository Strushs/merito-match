"use client";

import { useState, Suspense } from "react";
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
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
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

  const supabase = createClient();

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
        toast.success("Check your email to confirm your account!");
        setView("login");
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

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#111] px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 flex items-center justify-center gap-2 border-2 hover:bg-muted/50 transition-all"
            onClick={async () => {
              setLoading(true);
              const { error } = await supabase.auth.signInWithOAuth({
                provider: "azure",
                options: {
                  scopes: "email  openid",
                  redirectTo: `${window.location.origin}/auth/callback`,
                },
              });
              if (error) {
                toast.error(error.message);
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 23 23"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fill="#f3f3f3" d="M0 0h23v23H0z" />
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
            Sign in with Microsoft
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
