import { Skeleton } from "@/components/ui";
import AgentCardSkeleton from "./agent-card-skeleton";

export default function AgentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="w-32 h-8" />
        <div className="flex items-center gap-3">
          <Skeleton className="w-24 h-9 rounded-lg" />
          <Skeleton className="w-32 h-9 rounded-lg" />
        </div>
      </div>

      {/* Refresh indicator */}
      <div className="flex items-center justify-end">
        <Skeleton className="w-28 h-5" />
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Online Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-t-4 border-green-500 pt-3">
            <Skeleton className="w-20 h-6" />
            <Skeleton className="w-8 h-5 rounded-full" />
          </div>
          <AgentCardSkeleton />
          <AgentCardSkeleton />
        </div>

        {/* Running Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-t-4 border-blue-500 pt-3">
            <Skeleton className="w-20 h-6" />
            <Skeleton className="w-8 h-5 rounded-full" />
          </div>
          <AgentCardSkeleton />
        </div>

        {/* Offline Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-t-4 border-gray-300 pt-3">
            <Skeleton className="w-20 h-6" />
            <Skeleton className="w-8 h-5 rounded-full" />
          </div>
          <AgentCardSkeleton />
        </div>
      </div>
    </div>
  );
}
