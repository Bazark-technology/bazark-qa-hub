"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bot, Loader2 } from "lucide-react";
import type { DashboardAgent } from "@/types";

interface AgentStatusGridProps {
  agents: DashboardAgent[];
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ONLINE: "bg-green-500",
    RUNNING: "bg-blue-500",
    OFFLINE: "bg-gray-400",
    ERROR: "bg-red-500",
    PAUSED: "bg-yellow-500",
  };

  const shouldPulse = status === "ONLINE" || status === "RUNNING";

  return (
    <span className="relative flex h-2.5 w-2.5">
      {shouldPulse && (
        <span
          className={"animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 " + (colors[status] || colors.OFFLINE)}
        />
      )}
      <span
        className={"relative inline-flex rounded-full h-2.5 w-2.5 " + (colors[status] || colors.OFFLINE)}
      />
    </span>
  );
}

export default function AgentStatusGrid({ agents }: AgentStatusGridProps) {
  if (agents.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Agent Status</h3>
          <Link href="/agents" className="text-sm text-blue-600 hover:underline">
            Manage
          </Link>
        </div>
        <div className="text-center py-8">
          <Bot className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No agents registered</p>
          <Link href="/docs" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
            View setup docs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Agent Status</h3>
        <Link href="/agents" className="text-sm text-blue-600 hover:underline">
          Manage
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {agents.map((agent: DashboardAgent) => (
          <Link
            key={agent.id}
            href={"/agents"}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <StatusDot status={agent.status} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {agent.name}
              </p>
              {agent.status === "RUNNING" && agent.current_task ? (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Testing {agent.current_task.slice(0, 7)}</span>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  {agent.last_heartbeat
                    ? "Seen " + formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true })
                    : "Never connected"}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
