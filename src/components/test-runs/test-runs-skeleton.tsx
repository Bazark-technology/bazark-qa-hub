import { Skeleton } from "@/components/ui";
import TestRunCardSkeleton from "./test-run-card-skeleton";

export default function TestRunsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-24 h-7" />
          <Skeleton className="w-8 h-6 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-20 h-9 rounded-lg" />
          <Skeleton className="w-32 h-9 rounded-lg" />
          <Skeleton className="w-32 h-9 rounded-lg" />
          <Skeleton className="w-24 h-9 rounded-lg" />
          <Skeleton className="w-48 h-9 rounded-lg" />
          <Skeleton className="w-24 h-9 rounded-lg" />
        </div>
      </div>

      {/* Refresh indicator */}
      <div className="flex justify-end">
        <Skeleton className="w-32 h-4" />
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Running Column */}
        <div className="space-y-4">
          <div className="border-t-4 border-blue-500 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-16 h-5" />
              <Skeleton className="w-6 h-5 rounded-full" />
            </div>
          </div>
          <TestRunCardSkeleton />
        </div>

        {/* Queued Column */}
        <div className="space-y-4">
          <div className="border-t-4 border-yellow-500 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-16 h-5" />
              <Skeleton className="w-6 h-5 rounded-full" />
            </div>
          </div>
          <TestRunCardSkeleton />
          <TestRunCardSkeleton />
        </div>

        {/* Passed Column */}
        <div className="space-y-4">
          <div className="border-t-4 border-green-500 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-16 h-5" />
              <Skeleton className="w-6 h-5 rounded-full" />
            </div>
          </div>
          <TestRunCardSkeleton />
          <TestRunCardSkeleton />
          <TestRunCardSkeleton />
        </div>

        {/* Failed Column */}
        <div className="space-y-4">
          <div className="border-t-4 border-red-500 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-16 h-5" />
              <Skeleton className="w-6 h-5 rounded-full" />
            </div>
          </div>
          <TestRunCardSkeleton />
          <TestRunCardSkeleton />
        </div>
      </div>
    </div>
  );
}
