"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { XCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui";
import type { DashboardFailure } from "@/types";

interface RecentFailuresProps {
  failures: DashboardFailure[];
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "CRITICAL":
    case "HIGH":
      return <Badge variant="destructive" className="text-xs">{priority}</Badge>;
    case "MEDIUM":
      return <Badge variant="warning" className="text-xs">{priority}</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{priority}</Badge>;
  }
}

export default function RecentFailures({ failures }: RecentFailuresProps) {
  if (failures.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">Recent Failures</h3>
          </div>
          <Link href="/test-runs?status=FAILED" className="text-sm text-blue-600 hover:underline">
            View All
          </Link>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-green-600 font-medium">No recent failures</p>
          <p className="text-sm text-gray-400 mt-1">All tests are passing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Recent Failures</h3>
          <span className="flex items-center justify-center w-5 h-5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
            {failures.length}
          </span>
        </div>
        <Link href="/test-runs?status=FAILED" className="text-sm text-blue-600 hover:underline">
          View All
        </Link>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {failures.map((failure) => {
          const isHighPriority = failure.priority === "HIGH" || failure.priority === "CRITICAL";
          
          return (
            <Link
              key={failure.id}
              href={"/test-runs/" + failure.test_run_id}
              className={"block p-3 rounded-lg border transition-colors hover:border-red-200 " + (isHighPriority ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100")}
            >
              <div className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {failure.title}
                  </p>
                  {failure.bug_description && (
                    <p className="text-xs text-gray-500 italic truncate mt-0.5">
                      {failure.bug_description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs font-mono text-gray-500">
                      {failure.commit_hash.slice(0, 7)}
                    </code>
                    <span className="text-xs text-gray-400">{failure.agent_name}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getPriorityBadge(failure.priority)}
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(failure.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
