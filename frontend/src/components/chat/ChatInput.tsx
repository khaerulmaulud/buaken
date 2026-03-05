"use client";

import { Lock, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  disabledReason?: string;
  isSending?: boolean;
}

export function ChatInput({
  onSend,
  disabled = false,
  disabledReason,
  isSending = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || disabled || isSending) return;
    onSend(trimmed);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (disabled) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-white/3 border-t border-white/5 rounded-b-xl">
        <Lock className="h-4 w-4 text-white/30 shrink-0" />
        <span className="text-xs text-white/40">
          {disabledReason || "Chat is locked"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 p-3 bg-white/3 border-t border-white/5 rounded-b-xl">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        className={cn(
          "flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white",
          "placeholder:text-white/25 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10",
          "min-h-[40px] max-h-[120px] transition-colors",
        )}
        style={{ fieldSizing: "content" } as React.CSSProperties}
      />
      <Button
        onClick={handleSend}
        disabled={!message.trim() || isSending}
        size="icon"
        className={cn(
          "h-10 w-10 rounded-xl shrink-0 transition-all cursor-pointer",
          message.trim()
            ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            : "bg-white/5 text-white/30 hover:bg-white/10",
        )}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
