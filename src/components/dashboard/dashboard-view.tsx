"use client";

import { formatDistanceToNow, format } from "date-fns";
import { RefreshCw, Play } from "lucide-react";
import { Button, Toast } from "@/components/ui";
import { useDashboard } from "@/hooks/use-dashboard";
import StatCards from "./stat-cards";
import PassRateChart from "./pass-rate-chart";
import ActiveNow from "./active-now";
import RecentRuns from "./recent-runs";
import RecentFailures from "./recent-failures";
import TopFailingPages from "./top-failing-pages";
import AgentStatusGrid from "./agent-status-grid";
import type { DashboardData } from "@/types";

interface DashboardViewProps {
  initialData: DashboardData;
  userName: string;
}

export default function DashboardView({ initialData, userName }: DashboardViewProps) {
  const { data, isRefreshing, lastRefresh, refresh, error } = useDashboard(initialData);

  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {userName}
          </h1>
          <p className="text-gray-500 mt-1">{today}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Button variant="primary" disabled className="opacity-50 cursor-not-allowed">
              <Play className="w-4 h-4 mr-2" />
              Run QA
            </Button>
            <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              Manual QA runs coming soon
            </div>
          </div>

          <Button
            variant="outline"
            onClick={refresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={"w-4 h-4 mr-2 " + (isRefreshing ? "animate-spin" : "")} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Last updated */}
      <div className="flex justify-end text-sm text-gray-500">
        Updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}
      </div>

      {/* Stat Cards */}
      <StatCards stats={data.stats} />

      {/* Row 2: Chart + Active Now */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PassRateChart data={data.dailyChart} />
        </div>
        <div>
          <ActiveNow runs={data.activeRuns} />
        </div>
      </div>

      {/* Row 3: Recent Runs + Recent Failures */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentRuns runs={data.recentRuns} />
        </div>
        <div>
          <RecentFailures failures={data.recentFailures} />
        </div>
      </div>

      {/* Row 4: Top Failing Pages + Agent Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopFailingPages pages={data.topFailingPages} />
        <AgentStatusGrid agents={data.agents} />
      </div>

      {/* Error Toast */}
      {error && (
        <Toast message={error} type="error" onClose={() => {}} />
      )}
    </div>
  );
}
