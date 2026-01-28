"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Send,
  Loader2,
  MoreVertical,
  AlertTriangle,
  Shield,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { markMessagesAsRead, unmatchUser, submitReport } from "../actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PAGE_SIZE = 50;
const TYPING_DEBOUNCE_MS = 500;
const TYPING_TIMEOUT_MS = 3000;

// Bouncing Dots Typing Indicator Component
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-secondary rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
        <span className="text-white text-lg font-bold tracking-widest">
          <span
            className="inline-block animate-pulse"
            style={{ animationDelay: "0ms" }}
          >
            •
          </span>
          <span
            className="inline-block animate-pulse"
            style={{ animationDelay: "200ms" }}
          >
            •
          </span>
          <span
            className="inline-block animate-pulse"
            style={{ animationDelay: "400ms" }}
          >
            •
          </span>
        </span>
      </div>
    </div>
  );
}

type Message = {
  id: number;
  content: string;
  sender_id: string;
  created_at: string;
  isOptimistic?: boolean;
};

export default function ChatWindow({
  matchId,
  initialMessages,
  currentUserId,
  hasMoreMessages: initialHasMore,
}: {
  matchId: string;
  initialMessages: Message[];
  currentUserId: string;
  hasMoreMessages: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingBroadcastRef = useRef<number>(0);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null,
  );
  const supabase = createClient();
  const router = useRouter();

  // Report Dialog State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Check if user is near the bottom (within 100px)
  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 100;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    );
  };

  useEffect(() => {
    // Auto-scroll only if user is already near the bottom (not when loading older ones)
    if (!loadingMore && isNearBottom()) {
      scrollToBottom();
    }
  }, [messages, loadingMore, isOtherTyping]);

  useEffect(() => {
    // Mark as read on mount
    const markRead = async () => {
      try {
        await markMessagesAsRead(parseInt(matchId));
      } catch (e) {
        console.error("Failed to mark read:", e);
      }
    };
    markRead();
  }, [matchId]);

  // Polling function - wrapped in useCallback for dependency tracking
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return; // Already polling

    console.log("[Chat] WebSocket disconnected, starting fallback polling");
    pollingIntervalRef.current = setInterval(async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages((prev) => {
          const optimistic = prev.filter((m) => m.isOptimistic);
          const prevReal = prev.filter((m) => !m.isOptimistic);

          if (
            data.length === prevReal.length &&
            data[data.length - 1]?.id === prevReal[prevReal.length - 1]?.id
          ) {
            return [...data, ...optimistic];
          }

          const validOptimistic = optimistic.filter(
            (opt) =>
              !data.some(
                (d) =>
                  d.content === opt.content && d.sender_id === opt.sender_id,
              ),
          );

          return [...data, ...validOptimistic];
        });
      }
    }, 5000);
  }, [matchId, supabase]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log("[Chat] WebSocket connected, stopping polling");
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Load older messages (pagination)
  const loadOlderMessages = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;

    setLoadingMore(true);
    const oldestMessage = messages.find((m) => !m.isOptimistic);
    if (!oldestMessage) {
      setLoadingMore(false);
      return;
    }

    // Save scroll position before loading
    const container = messagesContainerRef.current;
    const scrollHeightBefore = container?.scrollHeight || 0;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .lt("created_at", oldestMessage.created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      toast.error("Failed to load older messages");
      setLoadingMore(false);
      return;
    }

    if (data && data.length > 0) {
      // Prepend older messages (reversed to show in order)
      setMessages((prev) => [...data.reverse(), ...prev]);
      setHasMore(data.length === PAGE_SIZE);

      // Restore scroll position after DOM update
      requestAnimationFrame(() => {
        if (container) {
          const scrollHeightAfter = container.scrollHeight;
          container.scrollTop = scrollHeightAfter - scrollHeightBefore;
        }
      });
    } else {
      setHasMore(false);
    }

    setLoadingMore(false);
  };

  useEffect(() => {
    // Realtime Subscription with connection status tracking
    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            if (newMsg.sender_id === currentUserId) {
              const optimisticIndex = prev.findIndex(
                (m) => m.isOptimistic && m.content === newMsg.content,
              );
              if (optimisticIndex !== -1) {
                const newArr = [...prev];
                newArr[optimisticIndex] = newMsg;
                return newArr;
              }
            }

            return [...prev, newMsg];
          });

          if (newMsg.sender_id !== currentUserId) {
            markMessagesAsRead(parseInt(matchId));
          }
        },
      )
      .subscribe((status) => {
        // Track connection status
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          stopPolling();
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsConnected(false);
          startPolling();
        }
      });

    // Start polling initially until WebSocket connects
    startPolling();

    return () => {
      supabase.removeChannel(channel);
      stopPolling();
    };
  }, [matchId, supabase, currentUserId, startPolling, stopPolling]);

  // Typing indicator channel
  useEffect(() => {
    const typingChannel = supabase
      .channel(`typing:${matchId}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        // Only show if it's from the other user
        if (payload.payload?.userId !== currentUserId) {
          setIsOtherTyping(true);

          // Clear existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          // Hide after TYPING_TIMEOUT_MS
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherTyping(false);
          }, TYPING_TIMEOUT_MS);
        }
      })
      .subscribe();

    typingChannelRef.current = typingChannel;

    return () => {
      supabase.removeChannel(typingChannel);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [matchId, supabase, currentUserId]);

  // Debounced typing broadcast
  const broadcastTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingBroadcastRef.current < TYPING_DEBOUNCE_MS) return;

    lastTypingBroadcastRef.current = now;
    typingChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId },
    });
  }, [currentUserId]);

  // Handle input change with typing broadcast
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) {
      broadcastTyping();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const optimisticMsg: Message = {
      id: Date.now(), // Temp ID
      content: newMessage.trim(),
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    scrollToBottom();

    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: currentUserId,
      content: optimisticMsg.content,
    });

    if (error) {
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    }
  };

  const handleUnmatch = async () => {
    if (
      !window.confirm(
        "Are you sure? This will delete all chat history permanently.",
      )
    ) {
      return;
    }

    try {
      await unmatchUser(parseInt(matchId));
      toast.success("Unmatched successfully");
      router.refresh();
      router.push("/chat");
    } catch (error) {
      console.error(error);
      toast.error("Failed to unmatch");
    }
  };

  const handleReport = async () => {
    if (!reportReason) {
      toast.error("Please select a reason");
      return;
    }

    setIsSubmittingReport(true);
    try {
      await submitReport(parseInt(matchId), reportReason, reportDescription);
      toast.success("Report submitted. An admin will review shortly.");
      setIsReportOpen(false);
      setReportReason("");
      setReportDescription("");
      router.refresh();
      router.push("/chat");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit report");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background w-full relative">
      <header className="h-16 border-b flex items-center justify-between px-4 bg-background/80 backdrop-blur z-50 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/chat" className="text-sm font-medium hover:underline">
            ← Matches
          </Link>
          <span className="font-semibold">Chat</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-orange-500 focus:text-orange-600 cursor-pointer"
              onClick={() => setIsReportOpen(true)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report User
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={handleUnmatch}
            >
              <Ban className="mr-2 h-4 w-4" />
              Unmatch
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Help us keep the community safe. Your report is anonymous.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="">Select a reason...</option>
                <option value="spam">Spam or scam</option>
                <option value="harassment">Harassment or bullying</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="fake">Fake profile</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Description (Optional)
              </label>
              <Textarea
                placeholder="Please provide more details..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReportOpen(false)}
              disabled={isSubmittingReport}
            >
              Cancel
            </Button>
            <Button onClick={handleReport} disabled={isSubmittingReport}>
              {isSubmittingReport ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Submit Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connection status indicator */}
      {!isConnected && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs text-center py-1 px-2">
          Reconnecting...
        </div>
      )}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-4 space-y-4 w-full"
      >
        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadOlderMessages}
              disabled={loadingMore}
              className="text-muted-foreground hover:text-foreground"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load older messages"
              )}
            </Button>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={cn("flex", isMe ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 md:px-5 md:py-3 text-[15px] md:text-base shadow-sm leading-relaxed wrap-break-word",
                  isMe
                    ? "bg-primary text-white rounded-tr-none"
                    : "bg-secondary text-white rounded-tl-none",
                  msg.isOptimistic && "opacity-70",
                )}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        {/* Typing Indicator */}
        {isOtherTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-background border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 rounded-full"
            maxLength={500}
          />
          <Button type="submit" size="icon" className="rounded-full">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
