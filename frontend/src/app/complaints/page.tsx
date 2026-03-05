"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  MessageSquareWarning,
  Plus,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { useComplaintChat } from "@/hooks/useComplaintChat";
import { useAuth } from "@/hooks/useAuth";
import { complaintService, type Complaint } from "@/services/complaint.service";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    textColor: string;
    icon: typeof Clock;
    borderColor: string;
  }
> = {
  pending: {
    label: "Pending",
    color: "bg-amber-500/10",
    textColor: "text-amber-400",
    icon: Clock,
    borderColor: "border-amber-500/30",
  },
  in_review: {
    label: "In Review",
    color: "bg-blue-500/10",
    textColor: "text-blue-400",
    icon: Eye,
    borderColor: "border-blue-500/30",
  },
  resolved: {
    label: "Resolved",
    color: "bg-emerald-500/10",
    textColor: "text-emerald-400",
    icon: CheckCircle2,
    borderColor: "border-emerald-500/30",
  },
  closed: {
    label: "Closed",
    color: "bg-zinc-500/10",
    textColor: "text-zinc-400",
    icon: XCircle,
    borderColor: "border-zinc-500/30",
  },
};

function formatCategory(cat: string) {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Chat Dialog ─────────────────────────────────────────────────────────
function ComplaintChatDialog({
  complaint,
  open,
  onClose,
}: {
  complaint: Complaint;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const {
    messages,
    isLoading: messagesLoading,
    isSending,
    sendMessage,
    scrollRef,
  } = useComplaintChat({
    complaintId: open ? complaint.id : null,
    isAdmin: false,
  });

  const status = statusConfig[complaint.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const isChatDisabled =
    complaint.status === "resolved" || complaint.status === "closed";
  const disabledReason =
    complaint.status === "resolved"
      ? "This complaint has been resolved. Chat is read-only."
      : complaint.status === "closed"
        ? "This complaint has been closed. Chat is read-only."
        : undefined;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 bg-[#0a0a0a] border border-white/10 text-white shadow-[0_25px_60px_rgba(0,0,0,0.7)] flex flex-col max-h-[85vh] overflow-hidden rounded-sm">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5">
          <DialogHeader className="mb-0">
            <DialogTitle className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
              {complaint.subject}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={cn(
                "flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm border",
                status.color,
                status.textColor,
                status.borderColor,
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
            <span className="text-[10px] font-mono text-zinc-600">
              {formatCategory(complaint.category)}
            </span>
            <span className="text-[10px] font-mono text-zinc-600">
              {format(new Date(complaint.createdAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-1 min-h-[200px]"
        >
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                Loading messages...
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="h-12 w-12 bg-amber-500/10 flex items-center justify-center rounded-sm mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                Awaiting response from support team
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                isOwnMessage={msg.senderId === user?.id}
              />
            ))
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={(content) => sendMessage(content)}
          disabled={isChatDisabled}
          disabledReason={disabledReason}
          isSending={isSending}
        />
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────
export default function MyComplaintsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );

  const { data, isLoading } = useQuery({
    queryKey: ["complaints", "my", page],
    queryFn: () => complaintService.getMyComplaints(page),
  });

  const getDashboardPath = () => {
    if (!user) return "/";
    switch (user.role) {
      case "customer":
        return "/";
      case "merchant":
        return "/merchant";
      case "courier":
        return "/courier";
      case "admin":
        return "/admin";
      default:
        return "/";
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8 p-5 sm:p-6 bg-[#0a0a0a] border border-white/10 rounded-sm">
        <div>
          <button
            type="button"
            onClick={() => router.push(getDashboardPath())}
            className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 hover:text-white transition-colors duration-300 mb-4 w-fit uppercase tracking-widest cursor-pointer"
          >
            ← Back to Dashboard
          </button>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <MessageSquareWarning className="h-3.5 w-3.5 text-amber-500" />
            Support Center
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white leading-none">
            My Complaints
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
            Track the status of your submitted complaints.
          </p>
        </div>
        <Link href="/complaints/new" className="shrink-0">
          <button
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-black uppercase text-xs tracking-widest rounded-sm transition-all duration-300 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Complaint
          </button>
        </Link>
      </div>

      {/* Complaint List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Loading complaints...
          </p>
        </div>
      ) : data?.data.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/5 p-8 sm:p-12 rounded-sm flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 bg-white/5 flex items-center justify-center rounded-sm mb-5">
            <MessageSquareWarning className="h-7 w-7 text-zinc-600" />
          </div>
          <p className="text-sm font-bold text-white uppercase tracking-tight mb-1">
            No complaints yet
          </p>
          <p className="text-xs text-zinc-500 font-mono mb-6 max-w-xs">
            Having an issue with an order? Let us know and we&apos;ll help.
          </p>
          <Link href="/complaints/new">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/10 hover:border-emerald-500 hover:bg-emerald-500/5 text-white font-bold uppercase text-xs tracking-widest rounded-sm transition-all duration-300 cursor-pointer"
            >
              Submit a Request
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.data.map((complaint) => {
            const status =
              statusConfig[complaint.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <button
                key={complaint.id}
                type="button"
                className="w-full text-left bg-[#0a0a0a] border border-white/5 p-4 sm:p-5 rounded-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.02] cursor-pointer group focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                onClick={() => setSelectedComplaint(complaint)}
              >
                {/* Mobile: stacked layout, Desktop: horizontal */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors duration-300">
                      {complaint.subject}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        {formatCategory(complaint.category)}
                      </span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-[10px] font-mono text-zinc-600">
                        {format(
                          new Date(complaint.createdAt),
                          "MMM d, yyyy • HH:mm",
                        )}
                      </span>
                      {complaint.orderId && (
                        <>
                          <span className="text-zinc-700 hidden sm:inline">
                            ·
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded-sm border border-white/5">
                            Order #{complaint.orderId.slice(0, 8)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 shrink-0 text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-sm border w-fit",
                      status.color,
                      status.textColor,
                      status.borderColor,
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Pagination */}
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-white/10 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:border-white/30 hover:text-white rounded-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <span className="text-[10px] font-mono text-zinc-500 px-2">
                Page <span className="text-white font-bold">{page}</span> of{" "}
                {data.meta.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.meta.totalPages}
                className="px-4 py-2 border border-white/10 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:border-white/30 hover:text-white rounded-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chat Dialog */}
      {selectedComplaint && (
        <ComplaintChatDialog
          complaint={selectedComplaint}
          open={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}
    </div>
  );
}
