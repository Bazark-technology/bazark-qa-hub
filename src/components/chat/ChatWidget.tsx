"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MessageCircle,
  X,
  ChevronDown,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { ChatMessage } from "./ChatMessage";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const {
    channels,
    activeChannel,
    setActiveChannel,
    messages,
    agents,
    sendMessage,
    isLoading,
    isSending,
    totalUnread,
  } = useChat("general");

  const currentChannel = channels.find((c) => c.slug === activeChannel);
  const recentMessages = messages.slice(-15);

  // Input state
  const [inputValue, setInputValue] = useState("");

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setShowChannelPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    await sendMessage(inputValue.trim());
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-40">
      {/* Expanded widget */}
      {isOpen && (
        <div className="mb-4 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">Agent Chat</span>

              {/* Channel picker */}
              <div className="relative">
                <button
                  onClick={() => setShowChannelPicker(!showChannelPicker)}
                  className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  #{currentChannel?.name || activeChannel}
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showChannelPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px] z-10">
                    {channels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => {
                          setActiveChannel(channel.slug);
                          setShowChannelPicker(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                          channel.slug === activeChannel
                            ? "text-blue-600 bg-blue-50"
                            : "text-gray-700"
                        }`}
                      >
                        #{channel.name}
                        {channel.unread_count > 0 && (
                          <span className="w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                            {channel.unread_count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/chat"
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Open full chat"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : recentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
                <MessageCircle className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm text-center">
                  No messages yet. Agents will post updates here.
                </p>
              </div>
            ) : (
              <div className="py-2">
                {recentMessages.map((message) => (
                  <div key={message.id} className="px-3 py-2 hover:bg-gray-50">
                    <div className="flex items-start gap-2">
                      {/* Compact avatar */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${
                          message.sender_type === "USER"
                            ? "bg-green-500 text-white"
                            : message.sender_type === "QA_AGENT"
                              ? "bg-blue-500 text-white"
                              : message.sender_type === "DEV_AGENT"
                                ? "bg-purple-500 text-white"
                                : "bg-gray-500 text-white"
                        }`}
                      >
                        {message.sender_type === "USER"
                          ? message.sender_name.charAt(0).toUpperCase()
                          : message.sender_type === "QA_AGENT"
                            ? "QA"
                            : message.sender_type === "DEV_AGENT"
                              ? "DA"
                              : "SY"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {message.sender_name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(message.created_at).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message #${currentChannel?.name || activeChannel}`}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          isOpen
            ? "bg-gray-600 hover:bg-gray-700"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}

        {/* Unread badge */}
        {!isOpen && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center bg-red-500 text-white text-xs font-medium rounded-full">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}
