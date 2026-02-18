"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, ChevronUp, MessageSquare } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { ChatMessage, ChatInput, ChatSidebar } from "@/components/chat";

// Date separator formatting
function formatDateSeparator(date: string): string {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (messageDate.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return messageDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      messageDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

// Group messages by date
function groupMessagesByDate(
  messages: Array<{ id: string; created_at: string }>
): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  messages.forEach((msg) => {
    const date = new Date(msg.created_at).toDateString();
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(msg.id);
  });

  return groups;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const initialChannel = searchParams.get("channel") || "general";

  const {
    channels,
    activeChannel,
    setActiveChannel,
    messages,
    isLoadingMessages,
    hasMoreMessages,
    loadMoreMessages,
    agents,
    sendMessage,
    isLoading,
    isSending,
    error,
  } = useChat(initialChannel);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Get current channel info
  const currentChannel = channels.find((c) => c.slug === activeChannel);

  // Auto-scroll to bottom when new messages arrive (if already at bottom)
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, shouldAutoScroll]);

  // Detect if user is at bottom of messages
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
  }, []);

  // Load more messages
  const handleLoadMore = async () => {
    if (loadingMore || !hasMoreMessages) return;
    setLoadingMore(true);

    // Save scroll position
    const container = messagesContainerRef.current;
    const scrollHeightBefore = container?.scrollHeight || 0;

    await loadMoreMessages();

    // Restore scroll position
    if (container) {
      const scrollHeightAfter = container.scrollHeight;
      container.scrollTop = scrollHeightAfter - scrollHeightBefore;
    }

    setLoadingMore(false);
  };

  // Handle send message
  const handleSend = async (content: string) => {
    await sendMessage(content);
  };

  // Screenshot lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleScreenshotClick = (screenshots: string[], index: number) => {
    setLightboxImages(screenshots);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxImages([]);
    setLightboxIndex(0);
  };

  // Group messages by date for date separators
  const dateGroups = groupMessagesByDate(messages);
  const dateGroupEntries = Array.from(dateGroups.entries());

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        channels={channels}
        agents={agents}
        activeChannel={activeChannel}
        onChannelSelect={setActiveChannel}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">
              #{currentChannel?.name || activeChannel}
            </h2>
            {currentChannel?.description && (
              <p className="text-sm text-gray-500">
                {currentChannel.description}
              </p>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {agents.filter((a) => a.status === "ONLINE" || a.status === "RUNNING").length}{" "}
            agents online
          </div>
        </div>

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          {/* Load more button */}
          {hasMoreMessages && (
            <div className="flex justify-center py-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
                Load older messages
              </button>
            </div>
          )}

          {/* Loading messages */}
          {isLoadingMessages && messages.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {/* Empty state */}
          {!isLoadingMessages && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm mt-1">
                Agents will post updates here as they work.
              </p>
            </div>
          )}

          {/* Messages with date separators */}
          {messages.length > 0 && (
            <div className="divide-y divide-gray-100">
              {dateGroupEntries.map(([date, messageIds], groupIndex) => (
                <div key={date}>
                  {/* Date separator */}
                  <div className="flex items-center justify-center py-4">
                    <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                      {formatDateSeparator(
                        messages.find((m) => m.id === messageIds[0])
                          ?.created_at || ""
                      )}
                    </div>
                  </div>

                  {/* Messages for this date */}
                  {messageIds.map((msgId) => {
                    const message = messages.find((m) => m.id === msgId);
                    if (!message) return null;
                    return (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        onScreenshotClick={handleScreenshotClick}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Agent working indicator */}
          {agents.some((a) => a.status === "RUNNING") && (
            <div className="px-4 py-2 text-sm text-gray-500 italic">
              {agents
                .filter((a) => a.status === "RUNNING")
                .map((a) => a.name)
                .join(", ")}{" "}
              is working...
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <ChatInput
          channelName={currentChannel?.name || activeChannel}
          agents={agents}
          onSend={handleSend}
          isSending={isSending}
        />
      </div>

      {/* Screenshot lightbox */}
      {lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <div className="max-w-4xl max-h-[90vh] overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImages[lightboxIndex]}
              alt="Screenshot"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          {lightboxImages.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {lightboxImages.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(i);
                  }}
                  className={`w-2 h-2 rounded-full ${i === lightboxIndex ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
