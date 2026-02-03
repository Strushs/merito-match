import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Sparkles, GraduationCap, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Blobs */}
      {/* Animated Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-secondary/40 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob delay-4000"></div>
      </div>

      <div className="max-w-4xl w-full z-10 grid md:grid-cols-2 gap-12 items-center">
        {/* Left Column: Branding & Value Prop */}
        <div className="space-y-8 text-center md:text-left">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-xl text-center">
              Finder
              <span className="text-primary">ito</span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground/90 font-light leading-relaxed max-w-lg mx-auto md:mx-0 text-center">
              Find your perfect{" "}
              <span className="font-semibold text-primary">study buddy</span> or{" "}
              <span className="font-semibold text-primary">soulmate</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
            <div className="flex items-center justify-center gap-2 text-foreground/80 text-sm font-medium w-full">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span>Verified Students</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interaction Card */}
        <div className="w-full max-w-md mx-auto relative group">
          <div className="absolute -inset-1 bg-linear-to-r from-primary to-secondary rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

          <Card className="relative glass-card border-white/10 rounded-3xl overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-50">
              <Heart className="h-24 w-24 text-primary/10 rotate-12" />
            </div>

            <CardContent className="pt-10 pb-8 px-8 space-y-8">
              <div className="text-center space-y-2">
                <div className="mx-auto h-20 w-20 bg-linear-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 mb-6 group-hover:rotate-6 transition-transform">
                  <Heart className="h-10 w-10 text-white fill-current" />
                </div>
                <h2 className="text-2xl font-bold text-white">Welcome Back!</h2>
                <p className="text-foreground/70">
                  Join thousands of students connecting today.
                </p>
              </div>

              <div className="space-y-4">
                <Link href="/login?view=login" className="w-full block">
                  <Button className="w-full h-14 text-lg font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg">
                    Log In
                  </Button>
                </Link>
                <Link href="/login?view=signup" className="w-full block">
                  <Button
                    variant="outline"
                    className="w-full h-14 text-lg font-bold rounded-xl border-2 border-white/20 text-white hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm"
                  >
                    Create Account
                  </Button>
                </Link>
              </div>

              <div className="pt-4 border-t border-white/10 text-center">
                <p className="text-xs text-pink-200/50 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                  <span>Exclusive to</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded text-white">
                    @student.gdansk.merito.pl
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
