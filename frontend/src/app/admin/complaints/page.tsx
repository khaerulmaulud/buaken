"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  MessageSquare,
  MessageSquareWarning,
  Search as SearchIcon,
  XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { useComplaintChat } from "@/hooks/useComplaintChat";
import { useAuth } from "@/hooks/useAuth";
import { complaintService, type Complaint } from "@/services/complaint.service";
import { cn } from "@/lib/utils";

// ── Status Config ───────────────────────────────────────────────────────
const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    icon: typeof Clock;
    dotColor: string;
    bg: string;
  }
> = {
  pending: {
    label: "Pending",
    color: "bg-amber-500/15 text-amber-500 border-amber-500/20",
    icon: Clock,
    dotColor: "bg-amber-500",
    bg: "bg-amber-500/5",
  },
  in_review: {
    label: "In Review",
    color: "bg-blue-500/15 text-blue-500 border-blue-500/20",
    icon: Eye,
    dotColor: "bg-blue-500",
    bg: "bg-blue-500/5",
  },
  resolved: {
    label: "Resolved",
    color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
    icon: CheckCircle2,
    dotColor: "bg-emerald-500",
    bg: "bg-emerald-500/5",
  },
  closed: {
    label: "Closed",
    color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
    icon: XCircle,
    dotColor: "bg-zinc-400",
    bg: "bg-zinc-500/5",
  },
};

const statusTabs = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "In Review", value: "in_review" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

function formatCategory(cat: string) {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Conversation Item (left panel) ──────────────────────────────────────
function ConversationItem({
  complaint,
  isSelected,
  onClick,
}: {
  complaint: Complaint;
  isSelected: boolean;
  onClick: () => void;
}) {
  const status = statusConfig[complaint.status] || statusConfig.pending;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3.5 transition-all cursor-pointer border-b border-white/5",
        isSelected
          ? "bg-white/8 border-l-2 border-l-emerald-500"
          : "hover:bg-white/5 border-l-2 border-l-transparent",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn("h-2 w-2 rounded-full shrink-0", status.dotColor)}
            />
            <span className="text-sm font-medium text-white/90 truncate">
              {complaint.reporter?.name || "Unknown User"}
            </span>
          </div>
          <p className="text-xs text-white/60 truncate pl-4 mb-1">
            {complaint.subject}
          </p>
          <p className="text-[11px] text-white/35 truncate pl-4">
            {complaint.description?.slice(0, 60)}...
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-[10px] text-white/30">
            {formatDistanceToNow(new Date(complaint.createdAt), {
              addSuffix: true,
            })}
          </span>
          {complaint.status === "pending" && (
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
          )}
        </div>
      </div>
    </button>
  );
}

// ── Chat Header ─────────────────────────────────────────────────────────
function ChatHeader({
  complaint,
  onResolve,
  onClose,
  isUpdating,
}: {
  complaint: Complaint;
  onResolve: () => void;
  onClose: () => void;
  isUpdating: boolean;
}) {
  const status = statusConfig[complaint.status] || statusConfig.pending;

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 bg-white/3 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/5">
          <span className="text-sm font-bold text-white/70">
            {(complaint.reporter?.name || "U").charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate">
              {complaint.reporter?.name || "Unknown"}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 border-white/10 font-medium",
                status.color,
              )}
            >
              {status.label}
            </Badge>
          </div>
          <p className="text-xs text-white/40 truncate">
            {complaint.subject} · {formatCategory(complaint.category)}
          </p>
        </div>
      </div>

      {/* Actions */}
      {complaint.status !== "closed" && complaint.status !== "resolved" && (
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={onResolve}
            disabled={isUpdating}
            className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer rounded-lg h-8 px-3 text-xs font-medium shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Resolve
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isUpdating}
            className="gap-1.5 cursor-pointer text-white/50 hover:text-white hover:bg-white/8 rounded-lg h-8 px-3 text-xs"
          >
            <XCircle className="h-3.5 w-3.5" />
            Close
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main Content ────────────────────────────────────────────────────────
function ComplaintsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const page = Number.parseInt(searchParams.get("page") || "1", 10);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "complaints", page, statusFilter],
    queryFn: () =>
      complaintService.getAll({
        page,
        status: statusFilter || undefined,
      }),
  });

  const {
    messages,
    isLoading: messagesLoading,
    isSending,
    sendMessage,
    scrollRef,
  } = useComplaintChat({
    complaintId: selectedComplaint?.id || null,
    isAdmin: true,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      complaintService.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "complaints"] });
      toast.success("Complaint status updated");
      setSelectedComplaint(null);
    },
    onError: () => {
      toast.error("Failed to update complaint");
    },
  });

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/complaints?${params.toString()}`, { scroll: false });
  };

  const handleSelect = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
  };

  const handleResolve = () => {
    if (!selectedComplaint) return;
    updateStatusMutation.mutate({
      id: selectedComplaint.id,
      status: "resolved",
    });
  };

  const handleClose = () => {
    if (!selectedComplaint) return;
    updateStatusMutation.mutate({
      id: selectedComplaint.id,
      status: "closed",
    });
  };

  // Filter complaints by search
  const filteredComplaints = useMemo(() => {
    if (!data?.data) return [];
    if (!searchQuery.trim()) return data.data;
    const q = searchQuery.toLowerCase();
    return data.data.filter(
      (c) =>
        c.subject.toLowerCase().includes(q) ||
        c.reporter?.name?.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q),
    );
  }, [data?.data, searchQuery]);

  const isChatDisabled =
    selectedComplaint?.status === "resolved" ||
    selectedComplaint?.status === "closed";

  const disabledReason =
    selectedComplaint?.status === "resolved"
      ? "This complaint has been resolved. Chat is read-only."
      : selectedComplaint?.status === "closed"
        ? "This complaint has been closed. Chat is read-only."
        : undefined;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
          Support Chat
        </h1>
        <p className="text-sm text-white/50 mt-1 font-medium">
          Manage complaint conversations
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-white/5 border border-white/5 p-1 overflow-x-auto backdrop-blur-md">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatusFilter(tab.value);
              handlePageChange(1);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
              statusFilter === tab.value
                ? "bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/10"
                : "text-white/50 hover:text-white hover:bg-white/5",
            )}
          >
            {tab.value && (
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  statusConfig[tab.value]?.dotColor,
                )}
              />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Split Pane: Conversation List + Chat Room */}
      <div className="flex rounded-xl border border-white/8 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden h-[calc(100vh-240px)] min-h-[500px]">
        {/* ─── Left Panel: Conversation List ─── */}
        <div className="w-[340px] shrink-0 border-r border-white/8 flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-white/5 border border-white/8 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/15 focus:ring-1 focus:ring-white/10 transition-colors"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`skel-${i}`}
                    className="px-4 py-3.5 border-b border-white/5"
                  >
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-white/10 mt-1.5 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-24 bg-white/10 rounded animate-pulse" />
                        <div className="h-3 w-40 bg-white/8 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <MessageSquareWarning className="h-10 w-10 text-white/15 mb-3" />
                <p className="text-sm text-white/40 font-medium">
                  No conversations found
                </p>
              </div>
            ) : (
              filteredComplaints.map((complaint) => (
                <ConversationItem
                  key={complaint.id}
                  complaint={complaint}
                  isSelected={selectedComplaint?.id === complaint.id}
                  onClick={() => handleSelect(complaint)}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="p-3 border-t border-white/5 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="text-xs text-white/50 hover:text-white h-7 cursor-pointer"
              >
                Prev
              </Button>
              <span className="text-[10px] text-white/30">
                {page} / {data.meta.totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= data.meta.totalPages}
                className="text-xs text-white/50 hover:text-white h-7 cursor-pointer"
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* ─── Right Panel: Chat Room ─── */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedComplaint ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 mb-5">
                <MessageSquare className="h-7 w-7 text-white/20" />
              </div>
              <p className="text-base font-semibold text-white/50 mb-1">
                Select a conversation
              </p>
              <p className="text-sm text-white/30 max-w-xs">
                Choose a complaint from the list to start reviewing and
                responding
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <ChatHeader
                complaint={selectedComplaint}
                onResolve={handleResolve}
                onClose={handleClose}
                isUpdating={updateStatusMutation.isPending}
              />

              {/* Complaint info bar */}
              <div className="px-5 py-2.5 bg-white/3 border-b border-white/5 flex items-center gap-3 text-xs text-white/40">
                <span>
                  <span className="text-white/20">Category:</span>{" "}
                  <span className="text-white/60">
                    {formatCategory(selectedComplaint.category)}
                  </span>
                </span>
                {selectedComplaint.orderId && (
                  <>
                    <span className="text-white/10">·</span>
                    <span>
                      <span className="text-white/20">Order:</span>{" "}
                      <span className="font-mono text-white/50">
                        #{selectedComplaint.orderId.slice(0, 8)}
                      </span>
                    </span>
                  </>
                )}
                <span className="text-white/10">·</span>
                <span>
                  <span className="text-white/20">Created:</span>{" "}
                  {format(
                    new Date(selectedComplaint.createdAt),
                    "MMM d, yyyy HH:mm",
                  )}
                </span>
              </div>

              {/* Messages area */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-5 py-4 space-y-1"
              >
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-2 text-white/30 text-sm">
                      <div className="h-4 w-4 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
                      Loading messages...
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <AlertTriangle className="h-8 w-8 text-amber-500/30 mb-3" />
                    <p className="text-sm text-white/40">
                      No messages yet. Send a reply to start the conversation.
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ComplaintsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-muted-foreground">
          Loading chat...
        </div>
      }
    >
      <ComplaintsPageContent />
    </Suspense>
  );
}
