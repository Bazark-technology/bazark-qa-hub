import { Skeleton } from "@/components/ui";
import StatCardsSkeleton from "./stat-cards-skeleton";
import PassRateChartSkeleton from "./pass-rate-chart-skeleton";
import ActiveNowSkeleton from "./active-now-skeleton";
import RecentRunsSkeleton from "./recent-runs-skeleton";
import RecentFailuresSkeleton from "./recent-failures-skeleton";
import TopFailingPagesSkeleton from "./top-failing-pages-skeleton";
import AgentStatusSkeleton from "./agent-status-skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="w-64 h-8 mb-2" />
          <Skeleton className="w-48 h-5" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-24 h-10 rounded-lg" />
          <Skeleton className="w-28 h-10 rounded-lg" />
        </div>
      </div>

      {/* Last updated */}
      <div className="flex justify-end">
        <Skeleton className="w-32 h-4" />
      </div>

      {/* Stat Cards */}
      <StatCardsSkeleton />

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PassRateChartSkeleton />
        </div>
        <div>
          <ActiveNowSkeleton />
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentRunsSkeleton />
        </div>
        <div>
          <RecentFailuresSkeleton />
        </div>
      </div>

      {/* Row 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopFailingPagesSkeleton />
        <AgentStatusSkeleton />
      </div>
    </div>
  );
}
