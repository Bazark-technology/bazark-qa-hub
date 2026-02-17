"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  MinusCircle,
  FlaskConical,
} from "lucide-react";
import { Badge } from "@/components/ui";
import type { DashboardRecentRun } from "@/types";

interface RecentRunsProps {
  runs: DashboardRecentRun[];
}

function getStatusIcon(status: string) {
  switch (status) {
    case "RUNNING":
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    case "PASSED":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "FAILED":
    case "TIMED_OUT":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "CANCELLED":
      return <MinusCircle className="w-4 h-4 text-gray-400" />;
    case "QUEUED":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
}

export default function RecentRuns({ runs }: RecentRunsProps) {
  if (runs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Test Runs</h3>
          <Link href="/test-runs" className="text-sm text-blue-600 hover:underline">
            View All
          </Link>
        </div>
        <div className="text-center py-8">
          <FlaskConical className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No test runs yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Runs will appear here once agents start testing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Test Runs</h3>
        <Link href="/test-runs" className="text-sm text-blue-600 hover:underline">
          View All
        </Link>
      </div>

      <div className="divide-y divide-gray-100">
        {runs.map((run: DashboardRecentRun, idx: number) => (
          <Link
            key={run.id}
            href={"/test-runs/" + run.id}
            className={"flex items-center gap-4 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors " + (idx % 2 === 1 ? "bg-gray-50/50" : "")}
          >
            <div className="flex-shrink-0">{getStatusIcon(run.status)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-gray-700">
                  {run.commit_hash.slice(0, 7)}
                </code>
                <span className="text-sm text-gray-600 truncate">
                  {run.commit_message.slice(0, 50)}
                  {run.commit_message.length > 50 ? "..." : ""}
                </span>
              </div>
            </div>

            <Badge variant="outline" className="text-xs flex-shrink-0 hidden sm:flex">
              {run.agent_name}
            </Badge>

            <Badge variant="outline" className="text-xs flex-shrink-0 hidden md:flex">
              {run.branch}
            </Badge>

            <div className="text-sm flex-shrink-0 w-24 text-right">
              {run.status === "PASSED" ? (
                <span className="text-green-600">{run.passed}/{run.total_tests} passed</span>
              ) : run.status === "FAILED" ? (
                <span className="text-red-600">{run.failed} failed</span>
              ) : run.status === "RUNNING" ? (
                <span className="text-blue-600">Running...</span>
              ) : (
                <span className="text-gray-500">{run.total_tests} tests</span>
              )}
            </div>

            <span className="text-xs text-gray-400 flex-shrink-0 w-16 text-right">
              {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
