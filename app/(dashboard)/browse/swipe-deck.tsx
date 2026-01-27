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
  avatar_url: string; // we query 'avatar_url' but display it
  nickname?: string;
};

export default function SwipeDeck({
  initialCandidates,
}: {
  initialCandidates: Profile[];
}) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [currentMatchId, setCurrentMatchId] = useState<number | null>(null);
  const router = useRouter();

  const activeCandidate = candidates[0];

  const handleSwipe = async (direction: "left" | "right") => {
    if (!activeCandidate) return;

    const candidateId = activeCandidate.id;
    // Optimistic removal
    setCandidates((prev) => prev.slice(1));

    if (direction === "right") {
      try {
        const result = await likeUser(candidateId);
        if (result.isMatch) {
          setCurrentMatchId(result.matchId);
          setMatchModalOpen(true);
        }
      } catch (e) {
        console.error(e);
        // revert? details
      }
    } else {
      await passUser(candidateId);
    }
  };

  if (!activeCandidate) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <h2 className="text-2xl font-bold mb-2">No more profiles!</h2>
        <p className="text-muted-foreground">
          Check back later for new students.
        </p>
        <p className="text-sm text-muted">
          Showing users with same intent: {activeCandidate?.intent}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto h-[70vh] relative">
      <AnimatePresence>
        <motion.div
          key={activeCandidate.id}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ x: 200, opacity: 0, transition: { duration: 0.2 } }}
          className="absolute inset-0 w-full h-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = offset.x;
            if (swipe > 100) handleSwipe("right");
            else if (swipe < -100) handleSwipe("left");
          }}
        >
          <Card className="h-full w-full overflow-hidden border-2 relative select-none">
            {/* Avatar Area */}
            <div className="h-2/3 bg-muted relative">
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
                  {activeCandidate.study_field}, Sem {activeCandidate.semester}
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

      <Dialog open={matchModalOpen} onOpenChange={setMatchModalOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-3xl font-extrabold text-primary">
              It&apos;s a Match! 🎉
            </DialogTitle>
            <DialogDescription className="text-lg">
              You and{" "}
              {activeCandidate?.nickname || activeCandidate?.study_field} liked
              each other!
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
              <Heart className="h-12 w-12 text-primary fill-primary animate-bounce" />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="secondary"
              onClick={() => setMatchModalOpen(false)}
            >
              Keep Browsing
            </Button>
            <Button
              className="w-full"
              onClick={() => router.push(`/chat/${currentMatchId}`)}
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
