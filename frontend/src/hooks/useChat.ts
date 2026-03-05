import { useEffect, useState, useCallback, useRef } from "react";
import { chatService, type ChatMessage } from "../services/chat.service";

export function useChatEvents(roomId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!roomId) return;
    try {
      setIsLoading(true);
      const fetchedMessages = await chatService.getMessages(roomId);
      setMessages(fetchedMessages);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch messages"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    fetchMessages();

    const token = localStorage.getItem("token");
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const sseUrl = `${baseUrl}/chat/stream`;
    const urlWithToken = token ? `${sseUrl}?token=${token}` : sseUrl;

    const eventSource = new EventSource(urlWithToken, {
      withCredentials: true,
    });

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.addEventListener("new_message", (event) => {
      try {
        const newMessage = JSON.parse(event.data) as ChatMessage;

        if (newMessage.roomId === roomId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      } catch {
        // Silently ignore malformed SSE payloads
      }
    });

    eventSource.onerror = () => {
      // EventSource auto-reconnects; suppress noisy console errors.
      // Only update state so the UI can optionally reflect it.
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [roomId, fetchMessages]);

  const sendMessage = async (content: string) => {
    const sent = await chatService.sendTextMessage(roomId, content);
    // Optimistic: append immediately if SSE hasn't echoed it yet
    setMessages((prev) => {
      if (prev.some((m) => m.id === sent.id)) return prev;
      return [...prev, sent];
    });
  };

  const sendImage = async (file: File) => {
    const sent = await chatService.sendImageMessage(roomId, file);
    setMessages((prev) => {
      if (prev.some((m) => m.id === sent.id)) return prev;
      return [...prev, sent];
    });
  };

  return {
    messages,
    isLoading,
    isConnected,
    error,
    sendMessage,
    sendImage,
    refresh: fetchMessages,
  };
}
