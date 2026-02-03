import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 bg-primary rounded-full flex items-center justify-center animate-pulse">
            <Heart className="h-12 w-12 text-primary-foreground fill-current" />
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-in text-white drop-shadow-sm">
          Finderito
        </h1>
        <p className="text-xl text-muted-foreground">
          Find your study buddy or soulmate
        </p>

        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Link href="/login?view=login" className="w-full">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 text-lg font-semibold rounded-full"
                >
                  Log In
                </Button>
              </Link>
              <Link href="/login?view=signup" className="w-full">
                <Button
                  size="lg"
                  className="w-full h-12 text-lg font-semibold rounded-full"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Exclusive to @student.gdansk.merito.pl
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
