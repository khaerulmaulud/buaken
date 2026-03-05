"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useMemo } from "react";
import {
  complaintService,
  type ComplaintMessage,
} from "@/services/complaint.service";

interface UseComplaintChatOptions {
  complaintId: string | null;
  isAdmin?: boolean;
}

export function useComplaintChat({
  complaintId,
  isAdmin = false,
}: UseComplaintChatOptions) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const queryKey = useMemo(
    () => ["complaint", "messages", complaintId, isAdmin],
    [complaintId, isAdmin],
  );

  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => {
      if (!complaintId) return [];
      return isAdmin
        ? complaintService.getAdminMessages(complaintId)
        : complaintService.getMessages(complaintId);
    },
    enabled: !!complaintId,
    refetchInterval: 5000, // Fallback polling every 5s in case SSE fails
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => {
      if (!complaintId) throw new Error("No complaint selected");
      return isAdmin
        ? complaintService.sendAdminMessage(complaintId, content)
        : complaintService.sendMessage(complaintId, content);
    },
    onSuccess: (newMessage) => {
      // Optimistically add the message
      queryClient.setQueryData<ComplaintMessage[]>(queryKey, (old = []) => [
        ...old,
        newMessage,
      ]);
      scrollToBottom();
    },
  });

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    // Reference messages.length to satisfy exhaustive-deps lint rule
    if (messages.length >= 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  // SSE subscription for real-time updates
  useEffect(() => {
    if (!complaintId) return;

    const baseUrl =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
        : "";
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) return;

    const eventSource = new EventSource(
      `${baseUrl}/complaints/stream?token=${token}`,
    );

    eventSource.addEventListener("new_complaint_message", (event) => {
      try {
        const newMessage: ComplaintMessage = JSON.parse(event.data);
        if (newMessage.complaintId === complaintId) {
          queryClient.setQueryData<ComplaintMessage[]>(queryKey, (old = []) => {
            // Avoid duplicates
            if (old.some((m) => m.id === newMessage.id)) return old;
            return [...old, newMessage];
          });
          scrollToBottom();
        }
      } catch {
        // ignore parse errors
      }
    });

    eventSource.onerror = () => {
      // SSE will auto-reconnect; fallback polling is active
    };

    return () => {
      eventSource.close();
    };
  }, [complaintId, queryClient, queryKey, scrollToBottom]);

  return {
    messages,
    isLoading,
    isSending: sendMutation.isPending,
    sendMessage: sendMutation.mutate,
    scrollRef,
    refetch,
  };
}
