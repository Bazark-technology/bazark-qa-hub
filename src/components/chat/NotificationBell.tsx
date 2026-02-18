"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, MessageSquare, Check } from "lucide-react";
import { useChatUnread } from "@/hooks/use-chat";
import type { ChatChannel, ChatMessage } from "@/types";

interface NotificationBellProps {
  className?: string;
}

interface UnreadNotification {
  channelSlug: string;
  channelName: string;
  message: {
    sender_name: string;
    content: string;
    created_at: string;
  };
}

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<UnreadNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { totalUnread } = useChatUnread();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchNotifications = async () => {
      setIsLoadingNotifications(true);
      try {
        // Fetch channels to get unread info
        const channelsRes = await fetch("/api/chat/channels");
        const channelsData = await channelsRes.json();

        if (!channelsData.success) return;

        const channels: ChatChannel[] = channelsData.channels;
        const unreadChannels = channels.filter((c) => c.unread_count > 0);

        // For each unread channel, get the last message
        const notifs: UnreadNotification[] = [];
        for (const channel of unreadChannels.slice(0, 5)) {
          if (channel.last_message) {
            notifs.push({
              channelSlug: channel.slug,
              channelName: channel.name,
              message: channel.last_message,
            });
          }
        }

        setNotifications(notifs);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    fetchNotifications();
  }, [isOpen]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      // Get all channels and mark each as read
      const res = await fetch("/api/chat/channels");
      const data = await res.json();
      if (!data.success) return;

      for (const channel of data.channels) {
        await fetch("/api/chat/messages/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel_id: channel.slug }),
        });
      }

      setNotifications([]);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Format relative time
  const formatRelativeTime = (date: string): string => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <span className="font-semibold text-gray-900">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {isLoadingNotifications ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No new notifications</p>
              </div>
            ) : (
              <div>
                {notifications.map((notif, index) => (
                  <Link
                    key={index}
                    href={`/chat?channel=${notif.channelSlug}`}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar placeholder */}
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">
                          {notif.message.sender_name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {notif.message.sender_name}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatRelativeTime(notif.message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {notif.message.content}
                        </p>
                        <span className="text-xs text-gray-400">
                          in #{notif.channelName}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
            <Link
              href="/chat"
              onClick={() => setIsOpen(false)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all in chat →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
