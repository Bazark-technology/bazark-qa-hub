"use client";

import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import {
  ExternalLink,
  GitBranch,
  Server,
  Globe,
  Clock,
  FlaskConical,
  TrendingUp,
  Calendar,
  Timer,
} from "lucide-react";
import { Modal, Badge, Button } from "@/components/ui";
import type { AgentWithStats } from "@/types";

interface AgentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AgentWithStats | null;
  onRemove: () => void;
}

function getStatusBadge(status: string) {
  const variants: Record<string, "success" | "default" | "destructive" | "warning"> = {
    ONLINE: "success",
    RUNNING: "default",
    OFFLINE: "default",
    ERROR: "destructive",
    PAUSED: "warning",
  };
  return variants[status] || "default";
}

function getRunStatusBadge(status: string) {
  const variants: Record<string, "success" | "default" | "destructive" | "warning"> = {
    PASSED: "success",
    RUNNING: "default",
    FAILED: "destructive",
    CANCELLED: "warning",
    QUEUED: "default",
    TIMED_OUT: "destructive",
  };
  return variants[status] || "default";
}

function getPassRateColor(rate: number): string {
  if (rate >= 90) return "text-green-600";
  if (rate >= 75) return "text-green-500";
  if (rate >= 60) return "text-yellow-500";
  if (rate >= 40) return "text-orange-500";
  return "text-red-500";
}

export default function AgentDetailModal({
  open,
  onOpenChange,
  agent,
  onRemove,
}: AgentDetailModalProps) {
  if (!agent) return null;

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{agent.name}</h2>
            <Badge variant={getStatusBadge(agent.status)} className="mt-1">
              {agent.status}
            </Badge>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Dev URL</label>
              <a
                href={agent.dev_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <Globe className="w-4 h-4" />
                {agent.dev_url}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Repo URL</label>
              <a
                href={agent.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <GitBranch className="w-4 h-4" />
                {agent.repo_url}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Branch</label>
              <p className="text-sm text-gray-900">{agent.branch}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Hostname</label>
              <p className="text-sm text-gray-900 flex items-center gap-1">
                <Server className="w-4 h-4 text-gray-400" />
                {agent.hostname || "N/A"}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">IP Address</label>
              <p className="text-sm text-gray-900">{agent.ip_address || "N/A"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Version</label>
              <p className="text-sm text-gray-900">{agent.version || "N/A"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Registered</label>
              <p className="text-sm text-gray-900">
                {format(new Date(agent.created_at), "PPP")}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Last Heartbeat</label>
              <p className={`text-sm ${agent.stats.is_stale ? "text-red-600" : "text-gray-900"}`}>
                {agent.last_heartbeat
                  ? `${format(new Date(agent.last_heartbeat), "PPp")} (${formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true })})`
                  : "Never"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <FlaskConical className="w-5 h-5 mx-auto text-gray-400 mb-1" />
            <div className="text-2xl font-bold text-gray-900">{agent.stats.total_runs}</div>
            <div className="text-xs text-gray-500">Total Runs</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <TrendingUp className="w-5 h-5 mx-auto text-gray-400 mb-1" />
            <div className={`text-2xl font-bold ${getPassRateColor(agent.stats.pass_rate)}`}>
              {agent.stats.total_runs > 0 ? `${agent.stats.pass_rate}%` : "N/A"}
            </div>
            <div className="text-xs text-gray-500">Pass Rate</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Calendar className="w-5 h-5 mx-auto text-gray-400 mb-1" />
            <div className="text-2xl font-bold text-gray-900">{agent.stats.today_runs}</div>
            <div className="text-xs text-gray-500">Today</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Timer className="w-5 h-5 mx-auto text-gray-400 mb-1" />
            <div className="text-2xl font-bold text-gray-900">
              {agent.stats.avg_duration_ms > 0
                ? `${Math.round(agent.stats.avg_duration_ms / 1000)}s`
                : "N/A"}
            </div>
            <div className="text-xs text-gray-500">Avg Duration</div>
          </div>
        </div>

        {/* Recent Test Runs */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Test Runs
          </h3>
          {agent.recent_runs.length > 0 ? (
            <div className="space-y-2">
              {agent.recent_runs.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={getRunStatusBadge(run.status)}>{run.status}</Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        <code className="text-xs bg-gray-200 px-1 rounded mr-2">
                          {run.commit_hash.slice(0, 7)}
                        </code>
                        {run.commit_message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-sm text-gray-500">
                      {run.passed}/{run.total_tests} passed
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No test runs yet</p>
          )}
          {agent.recent_runs.length > 0 && (
            <Link
              href={`/test-runs?agent_id=${agent.id}`}
              className="block text-center text-sm text-blue-600 hover:underline mt-3"
            >
              View all runs
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Link href={`/test-runs?agent_id=${agent.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View All Test Runs
            </Button>
          </Link>
          <Link href={`/agents/${agent.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              Configure
            </Button>
          </Link>
          <Button variant="danger" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
    </Modal>
  );
}
