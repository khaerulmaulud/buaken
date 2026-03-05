"use client";

import { format } from "date-fns";
import type { ComplaintMessage } from "@/services/complaint.service";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message: ComplaintMessage;
  isOwnMessage: boolean;
}

const roleColors: Record<string, string> = {
  admin: "text-emerald-400",
  customer: "text-blue-400",
  merchant: "text-amber-400",
  courier: "text-purple-400",
};

export function ChatBubble({ message, isOwnMessage }: ChatBubbleProps) {
  const roleColor =
    roleColors[message.sender?.role || "customer"] || "text-white/60";

  return (
    <div
      className={cn(
        "flex w-full mb-3",
        isOwnMessage ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
          isOwnMessage
            ? "bg-emerald-500/15 border border-emerald-500/20 rounded-br-md"
            : "bg-white/8 border border-white/10 rounded-bl-md",
        )}
      >
        {/* Sender info */}
        {!isOwnMessage && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-white/80 truncate">
              {message.sender?.name || "Unknown"}
            </span>
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/5",
                roleColor,
              )}
            >
              {message.sender?.role || "user"}
            </span>
          </div>
        )}

        {/* Content */}
        <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Image if exists */}
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Attachment"
            className="mt-2 rounded-lg max-w-full max-h-48 object-cover border border-white/10"
          />
        )}

        {/* Timestamp */}
        <div
          className={cn(
            "flex mt-1.5",
            isOwnMessage ? "justify-end" : "justify-start",
          )}
        >
          <span className="text-[10px] text-white/30">
            {format(new Date(message.createdAt), "HH:mm")}
          </span>
        </div>
      </div>
    </div>
  );
}
