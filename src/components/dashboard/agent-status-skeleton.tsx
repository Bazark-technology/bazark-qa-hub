import { Skeleton } from "@/components/ui";

export default function AgentStatusSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-28 h-6" />
        <Skeleton className="w-16 h-4" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Skeleton className="w-2.5 h-2.5 rounded-full" />
            <div className="flex-1">
              <Skeleton className="w-28 h-4 mb-1" />
              <Skeleton className="w-20 h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
