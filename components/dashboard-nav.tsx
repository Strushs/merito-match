"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, User, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import SignOutButton from "@/components/sign-out-button";

export default function DashboardNav() {
  const pathname = usePathname();

  const links = [
    { href: "/browse", label: "Browse", icon: Heart },
    { href: "/chat", label: "Matches", icon: MessageSquare },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const isChatRoom = pathname.startsWith("/chat/") && pathname !== "/chat";

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-background border-r h-screen fixed top-0 left-0 z-40">
        <div className="p-6 border-b flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
            <Heart className="text-primary-foreground h-5 w-5 fill-current" />
          </div>
          <h1 className="text-xl font-bold text-primary tracking-tight">
            Finderito
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-muted/50",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", isActive && "fill-primary/20")}
                />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/30">
            <span className="text-sm font-medium text-muted-foreground">
              Sign Out
            </span>
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav - Hidden in Chat Room */}
      {!isChatRoom && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t z-50 px-6 py-3 flex justify-between items-center pb-safe">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-muted/20",
                )}
              >
                <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
