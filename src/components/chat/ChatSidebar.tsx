"use client";

import { Hash, Bug, GitBranch, MessageSquare } from "lucide-react";
import type { ChatChannel, ChatAgent } from "@/types";

interface ChatSidebarProps {
  channels: ChatChannel[];
  agents: ChatAgent[];
  activeChannel: string;
  onChannelSelect: (slug: string) => void;
}

// Channel icons by type
const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  GENERAL: <Hash className="w-4 h-4" />,
  QA_REPORTS: <Bug className="w-4 h-4" />,
  DEV_TASKS: <GitBranch className="w-4 h-4" />,
  DIRECT: <MessageSquare className="w-4 h-4" />,
};

// Status dot colors
const STATUS_COLORS: Record<string, string> = {
  ONLINE: "bg-green-500",
  RUNNING: "bg-yellow-500 animate-pulse",
  OFFLINE: "bg-gray-400",
  ERROR: "bg-red-500",
  PAUSED: "bg-gray-400",
};

// Agent type badges
const AGENT_TYPE_BADGES: Record<string, { bg: string; text: string }> = {
  QA_AGENT: { bg: "bg-blue-100", text: "text-blue-700" },
  DEV_AGENT: { bg: "bg-purple-100", text: "text-purple-700" },
  MOBILE_QA_AGENT: { bg: "bg-orange-100", text: "text-orange-700" },
};

export function ChatSidebar({
  channels,
  agents,
  activeChannel,
  onChannelSelect,
}: ChatSidebarProps) {
  return (
    <div className="w-64 border-r border-gray-200 bg-white flex flex-col h-full">
      {/* Channels */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Channels
          </h3>
        </div>

        <div className="space-y-0.5 px-2">
          {channels.map((channel) => {
            const isActive = channel.slug === activeChannel;
            const icon =
              CHANNEL_ICONS[channel.type] || CHANNEL_ICONS.GENERAL;

            return (
              <button
                key={channel.id}
                onClick={() => onChannelSelect(channel.slug)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span
                  className={isActive ? "text-blue-600" : "text-gray-400"}
                >
                  {icon}
                </span>
                <span className="flex-1 font-medium truncate">
                  {channel.name}
                </span>
                {channel.unread_count > 0 && (
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-medium rounded-full">
                    {channel.unread_count > 99 ? "99+" : channel.unread_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-gray-200" />

        {/* Agents */}
        <div className="px-4 py-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Agents
          </h3>
        </div>

        <div className="space-y-0.5 px-2 pb-4">
          {agents.map((agent) => {
            const statusColor =
              STATUS_COLORS[agent.status] || STATUS_COLORS.OFFLINE;
            const typeBadge = AGENT_TYPE_BADGES[agent.agent_type];

            return (
              <div
                key={agent.id}
                className="flex items-start gap-2 px-3 py-2 rounded-lg text-gray-700"
              >
                {/* Status dot */}
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`}
                />

                {/* Agent info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{agent.name}</span>
                    {typeBadge && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${typeBadge.bg} ${typeBadge.text}`}
                      >
                        {agent.agent_type.replace("_AGENT", "").replace("_", " ")}
                      </span>
                    )}
                  </div>
                  {agent.status === "RUNNING" && agent.current_task && (
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {agent.current_task}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {agents.length === 0 && (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              No agents connected
            </div>
          )}
        </div>
      </div>

      {/* Online count */}
      <div className="border-t border-gray-200 px-4 py-3">
        <div className="text-xs text-gray-500">
          {agents.filter((a) => a.status === "ONLINE" || a.status === "RUNNING").length}{" "}
          of {agents.length} agents online
        </div>
      </div>
    </div>
  );
}
