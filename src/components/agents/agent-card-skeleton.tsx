import { Skeleton } from "@/components/ui";

export default function AgentCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      {/* Top Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="w-40 h-5" />
        </div>
        <Skeleton className="w-6 h-6 rounded" />
      </div>

      {/* Info Section */}
      <div className="space-y-2 mb-4">
        <Skeleton className="w-full h-4" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-12 h-5 rounded-full" />
          <Skeleton className="w-24 h-4" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>

      {/* Progress Bar */}
      <Skeleton className="w-full h-1 rounded-full" />

      {/* Last Heartbeat */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <Skeleton className="w-32 h-4" />
      </div>
    </div>
  );
}
