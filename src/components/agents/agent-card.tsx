"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  MoreVertical,
  ExternalLink,
  FlaskConical,
  Calendar,
  Clock,
  TrendingUp,
  Copy,
  Settings,
  Trash2,
  Eye,
  Check,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui";
import type { AgentWithStats } from "@/types";

interface AgentCardProps {
  agent: AgentWithStats;
  onRemove: () => void;
  onViewDetails: () => void;
}

function getPassRateColor(rate: number): string {
  if (rate >= 90) return "text-green-600";
  if (rate >= 75) return "text-green-500";
  if (rate >= 60) return "text-yellow-500";
  if (rate >= 40) return "text-orange-500";
  return "text-red-500";
}

function StatusDot({ status }: { status: string }) {
  const colors = {
    ONLINE: "bg-green-500",
    RUNNING: "bg-blue-500",
    OFFLINE: "bg-gray-400",
    ERROR: "bg-red-500",
    PAUSED: "bg-yellow-500",
  };

  const shouldPulse = status === "ONLINE" || status === "RUNNING";

  return (
    <span className="relative flex h-3 w-3">
      {shouldPulse && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors[status as keyof typeof colors] || colors.OFFLINE}`}
        />
      )}
      <span
        className={`relative inline-flex rounded-full h-3 w-3 ${colors[status as keyof typeof colors] || colors.OFFLINE}`}
      />
    </span>
  );
}

export default function AgentCard({ agent, onRemove, onViewDetails }: AgentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyKey = async () => {
    await navigator.clipboard.writeText(`bqa_****${agent.id.slice(-4)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setMenuOpen(false);
  };

  const lastHeartbeat = agent.last_heartbeat
    ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true })
    : "Never";

  const isHeartbeatStale = agent.stats.is_stale;

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
      onClick={onViewDetails}
    >
      {/* Top Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusDot status={agent.status} />
          <span className="font-semibold text-gray-900 truncate">{agent.name}</span>
        </div>
        <div ref={menuRef} className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyKey();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy API Key"}
              </button>
              <Link
                href={`/agents/${agent.id}?tab=config`}
                onClick={(e) => e.stopPropagation()}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="w-4 h-4" />
                Configure
              </Link>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onRemove();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Remove Agent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="space-y-2 mb-4">
        <a
          href={agent.dev_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline truncate"
        >
          {agent.dev_url}
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{agent.branch}</Badge>
          {agent.hostname && (
            <span className="text-xs text-gray-500 truncate">{agent.hostname}</span>
          )}
          {agent.version && (
            <span className="text-xs text-gray-400">v{agent.version}</span>
          )}
        </div>
      </div>

      {/* Running State */}
      {agent.status === "RUNNING" && agent.recent_runs[0]?.status === "RUNNING" && (
        <div className="mb-4 p-2 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="truncate">
              Testing {agent.recent_runs[0].commit_hash.slice(0, 7)}...
            </span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FlaskConical className="w-3 h-3" />
            Total Runs
          </div>
          <div className="font-semibold text-gray-900">{agent.stats.total_runs}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <TrendingUp className="w-3 h-3" />
            Pass Rate
          </div>
          <div className={`font-semibold ${getPassRateColor(agent.stats.pass_rate)}`}>
            {agent.stats.total_runs > 0 ? `${agent.stats.pass_rate}%` : "N/A"}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            Today
          </div>
          <div className="font-semibold text-gray-900">{agent.stats.today_runs}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            Last Run
          </div>
          <div className="font-semibold text-gray-900 text-sm truncate">
            {agent.stats.last_run
              ? formatDistanceToNow(new Date(agent.stats.last_run), { addSuffix: true })
              : "Never"}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {agent.stats.total_runs > 0 && (
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${agent.stats.pass_rate}%` }}
          />
        </div>
      )}

      {/* Last Heartbeat */}
      <div className="pt-3 border-t border-gray-100">
        <span className={`text-xs ${isHeartbeatStale ? "text-red-500" : "text-gray-500"}`}>
          Last seen {lastHeartbeat}
        </span>
      </div>
    </div>
  );
}
