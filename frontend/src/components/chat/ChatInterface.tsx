"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ImagePlus, Loader2 } from "lucide-react";
import { useChatEvents } from "@/hooks/useChat";

interface ChatInterfaceProps {
  roomId: string;
  currentUserId: string;
}

/**
 * ChatInterface — Utilitarian Grid Aesthetic
 *
 * Messages rendered as full-width log rows instead of floating bubbles.
 * Monospaced metadata (role, timestamp) with high-contrast message content.
 * Input area styled as a strict command-line bar.
 */
export function ChatInterface({ roomId, currentUserId }: ChatInterfaceProps) {
  const { messages, isLoading, sendMessage, sendImage } = useChatEvents(roomId);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSending, setIsSending] = useState(false);

  // Auto-scroll on new messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSending(true);
    try {
      await sendMessage(inputText);
      setInputText("");
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSending(true);
    try {
      await sendImage(file);
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
          Loading transmission log...
        </span>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "customer":
        return "text-cyan-400";
      case "merchant":
        return "text-amber-400";
      case "courier":
        return "text-emerald-400";
      case "system":
        return "text-zinc-500";
      default:
        return "text-zinc-400";
    }
  };

  const getRoleIndicator = (role: string) => {
    switch (role) {
      case "customer":
        return "bg-cyan-500";
      case "merchant":
        return "bg-amber-500";
      case "courier":
        return "bg-emerald-500";
      case "system":
        return "bg-zinc-600";
      default:
        return "bg-zinc-500";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] border border-white/10 overflow-hidden">
      {/* Message Log */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-700">
              {"// No messages yet — start the conversation"}
            </span>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              const roleLabel = msg.senderRole.toUpperCase();
              const time = new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={msg.id}
                  className={`px-3 py-2.5 transition-colors ${
                    isMe
                      ? "bg-white/[0.03]"
                      : "bg-transparent hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Row Header: role tag + timestamp */}
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${getRoleIndicator(msg.senderRole)}`}
                    />
                    <span
                      className={`font-mono text-[9px] font-bold tracking-widest ${getRoleColor(msg.senderRole)}`}
                    >
                      {isMe ? "YOU" : roleLabel}
                    </span>
                    {msg.sender?.name && !isMe && (
                      <span className="font-mono text-[9px] text-zinc-600 truncate max-w-[120px]">
                        {msg.sender.name}
                      </span>
                    )}
                    <span className="font-mono text-[9px] text-zinc-700 ml-auto tabular-nums">
                      {time}
                    </span>
                  </div>

                  {/* Message Content */}
                  {msg.messageType === "text" ? (
                    <p className="text-[13px] text-zinc-200 leading-relaxed pl-3.5">
                      {msg.content}
                    </p>
                  ) : (
                    <div className="pl-3.5 mt-1">
                      <img
                        src={msg.imageUrl}
                        alt="Attachment from chat"
                        className="max-h-40 max-w-[200px] object-cover border border-white/10"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Command Input Bar */}
      <div className="border-t border-white/10 bg-[#0a0a0a]">
        <form onSubmit={handleSend} className="flex items-center">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button
            type="button"
            disabled={isSending}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-3 text-zinc-600 hover:text-zinc-300 transition-colors disabled:opacity-30"
          >
            <ImagePlus className="h-4 w-4" />
          </button>

          <div className="flex-1 flex items-center border-l border-white/5">
            <span className="font-mono text-[10px] text-zinc-700 pl-2 select-none">
              {">"}
            </span>
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message..."
              className="flex-1 bg-transparent text-zinc-200 text-[13px] px-2 py-3 outline-none placeholder:text-zinc-700 font-sans"
              disabled={isSending}
            />
          </div>

          <Button
            type="submit"
            disabled={!inputText.trim() || isSending}
            size="icon"
            className="h-full rounded-none px-4 bg-transparent hover:bg-white/5 text-zinc-500 hover:text-zinc-200 disabled:opacity-20 transition-colors border-l border-white/5"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
