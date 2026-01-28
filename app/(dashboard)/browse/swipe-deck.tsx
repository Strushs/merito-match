"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { likeUser, passUser } from "./actions";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  study_field: string;
  semester: number;
  intent: string;
  bio: string;
  avatar_url: string;
  nickname?: string;
};

export default function SwipeDeck({
  initialCandidates,
}: {
  initialCandidates: Profile[];
}) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [pendingMatch, setPendingMatch] = useState<{
    profile: Profile;
    matchId: number;
  } | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null,
  );
  const [dragX, setDragX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const router = useRouter();

  const activeCandidate = candidates[0];

  const handleSwipe = async (direction: "left" | "right") => {
    if (!activeCandidate || isSwiping) return;

    // Prevent overlapping swipes
    setIsSwiping(true);

    // Capture the profile BEFORE any state changes or async calls
    const swipedProfile = activeCandidate;
    const candidateId = swipedProfile.id;

    setSwipeDirection(direction);

    if (direction === "right") {
      try {
        const result = await likeUser(candidateId);
        if (result.isMatch) {
          // Use the captured profile, not activeCandidate
          setPendingMatch({
            profile: swipedProfile,
            matchId: result.matchId,
          });
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      await passUser(candidateId);
    }

    // Remove card after API call completes
    setCandidates((prev) => prev.slice(1));
    setSwipeDirection(null);
    setDragX(0);
    setIsSwiping(false);
  };

  // Calculate visual feedback based on drag
  const showLike = dragX > 50;
  const showNope = dragX < -50;
  const rotation = dragX / 20;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-64 md:max-w-md mx-auto h-[55vh] md:h-[70vh] md:mt-8 relative px-2">
      {!activeCandidate ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <h2 className="text-2xl font-bold mb-2">No more profiles!</h2>
          <p className="text-muted-foreground">
            Check back later for new students.
          </p>
        </div>
      ) : (
        <>
          {/* Visual feedback icons - overlay on top of card */}
          <div
            className="absolute left-0 inset-y-0 flex items-center justify-center pointer-events-none z-20 w-1/3 transition-opacity duration-150"
            style={{ opacity: showNope ? 1 : 0 }}
          >
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-destructive/40 flex items-center justify-center">
              <X className="w-10 h-10 md:w-14 md:h-14 text-destructive" />
            </div>
          </div>
          <div
            className="absolute right-0 inset-y-0 flex items-center justify-center pointer-events-none z-20 w-1/3 transition-opacity duration-150"
            style={{ opacity: showLike ? 1 : 0 }}
          >
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-green-500/40 flex items-center justify-center">
              <Heart className="w-10 h-10 md:w-14 md:h-14 text-green-500 fill-green-500" />
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeCandidate.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                x: swipeDirection
                  ? swipeDirection === "left"
                    ? -400
                    : 400
                  : 0,
                rotate: swipeDirection
                  ? swipeDirection === "left"
                    ? -20
                    : 20
                  : rotation,
              }}
              exit={{
                x: swipeDirection === "left" ? -400 : 400,
                opacity: 0,
                rotate: swipeDirection === "left" ? -20 : 20,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                opacity: { duration: 0.2 },
              }}
              className="absolute inset-0 w-full h-full z-10 cursor-grab active:cursor-grabbing"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDrag={(_e, info) => {
                setDragX(info.offset.x);
              }}
              onDragEnd={(_e, { offset, velocity }) => {
                const swipe = offset.x;
                const swipeVelocity = velocity.x;

                if (swipe > 100 || swipeVelocity > 500) {
                  handleSwipe("right");
                } else if (swipe < -100 || swipeVelocity < -500) {
                  handleSwipe("left");
                } else {
                  // Reset drag state - card will animate back via spring
                  setDragX(0);
                }
              }}
            >
              <Card className="h-full w-full overflow-hidden border-2 relative select-none">
                {/* Avatar Area */}
                <div className="h-2/3 bg-muted relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeCandidate.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4 text-white">
                    <h2 className="text-3xl font-bold">
                      {activeCandidate.nickname || activeCandidate.study_field}
                    </h2>
                    <p className="text-lg opacity-90">
                      {activeCandidate.study_field}, Sem{" "}
                      {activeCandidate.semester}
                    </p>
                  </div>
                </div>
                <CardContent className="p-4 pt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {activeCandidate.intent}
                    </span>
                  </div>
                  <p className="text-muted-foreground line-clamp-3">
                    {activeCandidate.bio}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          <div className="absolute -bottom-20 flex gap-6 z-10">
            <Button
              variant="outline"
              size="icon"
              className="h-16 w-16 rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-colors shadow-lg"
              onClick={() => handleSwipe("left")}
            >
              <X className="h-8 w-8" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-16 w-16 rounded-full border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-colors shadow-lg"
              onClick={() => handleSwipe("right")}
            >
              <Heart className="h-8 w-8 fill-current" />
            </Button>
          </div>
        </>
      )}

      <Dialog
        open={!!pendingMatch}
        onOpenChange={(open) => !open && setPendingMatch(null)}
      >
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-3xl font-extrabold text-primary">
              It&apos;s a Match! 🎉
            </DialogTitle>
            <DialogDescription className="text-lg">
              You and{" "}
              {pendingMatch?.profile?.nickname ||
                pendingMatch?.profile?.study_field}{" "}
              liked each other!
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
              <Heart className="h-12 w-12 text-primary fill-primary animate-bounce" />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-col gap-2 sm:space-x-0">
            <Button variant="secondary" onClick={() => setPendingMatch(null)}>
              Keep Browsing
            </Button>
            <Button
              className="w-full"
              onClick={() => {
                const matchId = pendingMatch?.matchId;
                setPendingMatch(null);
                router.push(`/chat/${matchId}`);
              }}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Start Chatting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
