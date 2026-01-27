"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { markMessagesAsRead } from "../actions";

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
}: {
  matchId: string;
  initialMessages: Message[];
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  useEffect(() => {
    // Realtime Subscription
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
            // Check if we already have this message ID
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            // Check if we have an optimistic message with same content from me
            // If so, replace it with the real one
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

          // Mark as read if we receive a message while looking at the chat
          // (Only if it's not from me)
          if (newMsg.sender_id !== currentUserId) {
            markMessagesAsRead(parseInt(matchId));
          }
        },
      )
      .subscribe();

    // Fallback polling (every 5s) - Safety net
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages((prev) => {
          // Keep optimistic messages that are NOT in the new data yet
          const optimistic = prev.filter((m) => m.isOptimistic);

          // If data is identical to non-optimistic prev, do nothing
          // (Simple length check is heuristic, deep check is better but maybe overkill)
          const prevReal = prev.filter((m) => !m.isOptimistic);
          if (
            data.length === prevReal.length &&
            data[data.length - 1]?.id === prevReal[prevReal.length - 1]?.id
          ) {
            // Just append optimistic if any? No, we need to be careful.
            // If we have optimistic, and data is same as real, keep combination.
            return [...data, ...optimistic];
          }

          // Deduplicate: If an optimistic message is now in data, remove it from optimistic list
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

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [matchId, supabase, currentUserId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const optimisticMsg: Message = {
      id: Date.now(), // Temp ID
      content: newMessage,
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
      // Could remove the optimistic message here
    }
  };

  return (
    <div className="flex flex-col h-full bg-background w-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 w-full">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={cn("flex", isMe ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm",
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
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-background border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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
