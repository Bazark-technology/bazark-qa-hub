"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessageSquare } from "lucide-react";
import { NotificationBell } from "@/components/chat";
import { useChatUnread } from "@/hooks/use-chat";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/agents": "Agents",
  "/test-runs": "Test Runs",
  "/chat": "Agent Chat",
  "/reports": "Reports",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  // Check exact match first
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  // Check if path starts with any known route
  for (const [route, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(route)) {
      return title;
    }
  }

  return "Dashboard";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ChatButton() {
  const { totalUnread } = useChatUnread();

  return (
    <Link
      href="/chat"
      className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <MessageSquare className="w-5 h-5" />
      {totalUnread > 0 && (
        <span className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-medium rounded-full">
          {totalUnread > 9 ? "9+" : totalUnread}
        </span>
      )}
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      {/* Left: Page Title */}
      <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>

      {/* Right: Chat, Notifications, User */}
      <div className="flex items-center gap-2">
        {/* Chat */}
        <ChatButton />

        {/* Notifications */}
        <NotificationBell />

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-sm font-medium ml-2">
          {session?.user?.name ? getInitials(session.user.name) : "U"}
        </div>
      </div>
    </header>
  );
}
