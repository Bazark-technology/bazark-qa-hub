"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ChatChannel,
  ChatMessage,
  ChatAgent,
  ChatChannelsResponse,
  ChatMessagesResponse,
  ChatAgentsResponse,
  SendMessageRequest,
  SendMessageResponse,
} from "@/types";

interface UseChatReturn {
  // Channels
  channels: ChatChannel[];
  activeChannel: string;
  setActiveChannel: (slug: string) => void;

  // Messages
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  loadMoreMessages: () => Promise<void>;

  // Agents
  agents: ChatAgent[];

  // Actions
  sendMessage: (
    content: string,
    options?: Partial<SendMessageRequest>
  ) => Promise<ChatMessage | null>;
  markAsRead: (channelId?: string) => Promise<void>;
  refresh: () => Promise<void>;

  // State
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  totalUnread: number;
}

const MESSAGES_POLL_INTERVAL = 3000; // 3 seconds for active channel
const CHANNELS_POLL_INTERVAL = 30000; // 30 seconds for unread counts
const AGENTS_POLL_INTERVAL = 10000; // 10 seconds for agent status

export function useChat(initialChannel: string = "general"): UseChatReturn {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState(initialChannel);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agents, setAgents] = useState<ChatAgent[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastMessageTimestamp = useRef<string | null>(null);
  const oldestMessageId = useRef<string | null>(null);

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/channels");
      const json: ChatChannelsResponse = await res.json();
      if (json.success) {
        setChannels(json.channels);
      }
    } catch (err) {
      console.error("Failed to fetch channels:", err);
    }
  }, []);

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/agents");
      const json: ChatAgentsResponse = await res.json();
      if (json.success) {
        setAgents(json.agents);
      }
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    }
  }, []);

  // Fetch messages for active channel
  const fetchMessages = useCallback(
    async (reset: boolean = false) => {
      if (!activeChannel) return;

      try {
        setIsLoadingMessages(true);
        const params = new URLSearchParams({
          channel_slug: activeChannel,
          limit: "50",
        });

        const res = await fetch(`/api/chat/messages?${params}`);
        const json: ChatMessagesResponse = await res.json();

        if (json.success) {
          setMessages(json.messages);
          setHasMoreMessages(json.has_more);

          if (json.messages.length > 0) {
            lastMessageTimestamp.current =
              json.messages[json.messages.length - 1].created_at;
            oldestMessageId.current = json.messages[0].id;
          }
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setError("Failed to load messages");
      } finally {
        setIsLoadingMessages(false);
        if (reset) setIsLoading(false);
      }
    },
    [activeChannel]
  );

  // Poll for new messages
  const pollNewMessages = useCallback(async () => {
    if (!activeChannel || !lastMessageTimestamp.current) return;

    try {
      const params = new URLSearchParams({
        channel_slug: activeChannel,
        after: lastMessageTimestamp.current,
      });

      const res = await fetch(`/api/chat/messages?${params}`);
      const json: ChatMessagesResponse = await res.json();

      if (json.success && json.messages.length > 0) {
        setMessages((prev) => [...prev, ...json.messages]);
        lastMessageTimestamp.current =
          json.messages[json.messages.length - 1].created_at;
      }
    } catch (err) {
      console.error("Failed to poll messages:", err);
    }
  }, [activeChannel]);

  // Load more (older) messages
  const loadMoreMessages = useCallback(async () => {
    if (!activeChannel || !oldestMessageId.current || !hasMoreMessages) return;

    try {
      setIsLoadingMessages(true);
      const params = new URLSearchParams({
        channel_slug: activeChannel,
        limit: "50",
        before: oldestMessageId.current,
      });

      const res = await fetch(`/api/chat/messages?${params}`);
      const json: ChatMessagesResponse = await res.json();

      if (json.success) {
        setMessages((prev) => [...json.messages, ...prev]);
        setHasMoreMessages(json.has_more);

        if (json.messages.length > 0) {
          oldestMessageId.current = json.messages[0].id;
        }
      }
    } catch (err) {
      console.error("Failed to load more messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeChannel, hasMoreMessages]);

  // Send message
  const sendMessage = useCallback(
    async (
      content: string,
      options?: Partial<SendMessageRequest>
    ): Promise<ChatMessage | null> => {
      if (!activeChannel || !content.trim()) return null;

      try {
        setIsSending(true);
        const res = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel_id: activeChannel,
            content,
            ...options,
          }),
        });

        const json: SendMessageResponse = await res.json();

        if (json.success) {
          // Add message to list
          setMessages((prev) => [...prev, json.message]);
          lastMessageTimestamp.current = json.message.created_at;
          return json.message;
        } else {
          setError("Failed to send message");
          return null;
        }
      } catch (err) {
        console.error("Failed to send message:", err);
        setError("Failed to send message");
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [activeChannel]
  );

  // Mark messages as read
  const markAsRead = useCallback(
    async (channelId?: string) => {
      const channelToMark = channelId || activeChannel;
      if (!channelToMark) return;

      try {
        await fetch("/api/chat/messages/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel_id: channelToMark }),
        });

        // Update local unread count
        setChannels((prev) =>
          prev.map((c) =>
            c.slug === channelToMark ? { ...c, unread_count: 0 } : c
          )
        );
      } catch (err) {
        console.error("Failed to mark as read:", err);
      }
    },
    [activeChannel]
  );

  // Full refresh
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchChannels(), fetchAgents(), fetchMessages(true)]);
    setIsLoading(false);
  }, [fetchChannels, fetchAgents, fetchMessages]);

  // Initial load
  useEffect(() => {
    refresh();
  }, []);

  // Reload messages when channel changes
  useEffect(() => {
    lastMessageTimestamp.current = null;
    oldestMessageId.current = null;
    setMessages([]);
    fetchMessages(true);
  }, [activeChannel, fetchMessages]);

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(pollNewMessages, MESSAGES_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [pollNewMessages]);

  // Poll for channel updates (unread counts)
  useEffect(() => {
    const interval = setInterval(fetchChannels, CHANNELS_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchChannels]);

  // Poll for agent status updates
  useEffect(() => {
    const interval = setInterval(fetchAgents, AGENTS_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  // Mark as read when viewing channel
  useEffect(() => {
    if (activeChannel && messages.length > 0) {
      markAsRead();
    }
  }, [activeChannel, messages.length, markAsRead]);

  // Calculate total unread
  const totalUnread = channels.reduce((sum, c) => sum + c.unread_count, 0);

  return {
    channels,
    activeChannel,
    setActiveChannel,
    messages,
    isLoadingMessages,
    hasMoreMessages,
    loadMoreMessages,
    agents,
    sendMessage,
    markAsRead,
    refresh,
    isLoading,
    isSending,
    error,
    totalUnread,
  };
}

// Simplified hook for just unread count (for notification bell)
export function useChatUnread(): { totalUnread: number; isLoading: boolean } {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/channels");
      const json: ChatChannelsResponse = await res.json();
      if (json.success) {
        setChannels(json.channels);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
    const interval = setInterval(fetchChannels, CHANNELS_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchChannels]);

  const totalUnread = channels.reduce((sum, c) => sum + c.unread_count, 0);

  return { totalUnread, isLoading };
}
