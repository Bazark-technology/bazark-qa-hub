"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui";
import type { ActiveRun } from "@/types";

interface ActiveNowProps {
  runs: ActiveRun[];
}

function formatElapsedTime(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - start) / 1000);

  if (elapsed < 60) {
    return elapsed + "s";
  }
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  if (minutes < 60) {
    return minutes + "m " + seconds + "s";
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours + "h " + remainingMinutes + "m";
}

function ActiveRunItem({ run }: { run: ActiveRun }) {
  const [elapsed, setElapsed] = useState(formatElapsedTime(run.started_at));

  // Update elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatElapsedTime(run.started_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [run.started_at]);

  const progressPercent = run.total_tests > 0 ? (run.completed / run.total_tests) * 100 : 0;
  const passedPercent = run.total_tests > 0 ? (run.passed / run.total_tests) * 100 : 0;
  const failedPercent = run.total_tests > 0 ? (run.failed / run.total_tests) * 100 : 0;

  return (
    <Link
      href={"/test-runs/" + run.id}
      className="block p-4 bg-blue-50/50 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="text-xs">
          {run.agent_name}
        </Badge>
        <span className="text-xs text-gray-500">{elapsed}</span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
        <code className="text-sm font-mono text-gray-700">
          {run.commit_hash.slice(0, 7)}
        </code>
        <span className="text-sm text-gray-600 truncate flex-1">
          {run.commit_message}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex mb-2">
        {passedPercent > 0 && (
          <div
            className="h-full bg-green-500"
            style={{ width: passedPercent + "%" }}
          />
        )}
        {failedPercent > 0 && (
          <div
            className="h-full bg-red-500"
            style={{ width: failedPercent + "%" }}
          />
        )}
      </div>

      <p className="text-xs text-gray-500">
        {run.completed}/{run.total_tests} tests complete
        {run.passed > 0 && <span className="text-green-600 ml-2">{run.passed} passed</span>}
        {run.failed > 0 && <span className="text-red-600 ml-2">{run.failed} failed</span>}
      </p>
    </Link>
  );
}

export default function ActiveNow({ runs }: ActiveNowProps) {
  const hasActive = runs.length > 0;

  return (
    <div className={"bg-white rounded-xl shadow-sm border border-gray-100 p-6 " + (hasActive ? "ring-2 ring-blue-100" : "")}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Active Now</h3>
        {hasActive && (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
        )}
      </div>

      {hasActive ? (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {runs.map((run) => (
            <ActiveRunItem key={run.id} run={run} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">All quiet</p>
          <p className="text-sm text-gray-400 mt-1">No tests currently running</p>
        </div>
      )}
    </div>
  );
}
