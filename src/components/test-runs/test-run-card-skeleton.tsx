import { Skeleton } from "@/components/ui";

export default function TestRunCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-gray-200 p-4">
      {/* Top Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="w-16 h-5" />
          <Skeleton className="w-14 h-5 rounded-full" />
        </div>
        <Skeleton className="w-12 h-4" />
      </div>

      {/* Commit message */}
      <Skeleton className="w-full h-5 mb-1" />
      <Skeleton className="w-3/4 h-5 mb-3" />

      {/* Author row */}
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-24 h-5 rounded-full ml-auto" />
      </div>

      {/* Checklist preview */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-3.5 h-3.5 rounded-full" />
          <Skeleton className="w-48 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-3.5 h-3.5 rounded-full" />
          <Skeleton className="w-40 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-3.5 h-3.5 rounded-full" />
          <Skeleton className="w-44 h-4" />
        </div>
      </div>

      {/* Stats bar */}
      <Skeleton className="w-full h-1.5 rounded-full mb-2" />
      <Skeleton className="w-32 h-3" />
    </div>
  );
}
