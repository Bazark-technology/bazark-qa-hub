import { Skeleton } from "@/components/ui";

export default function RecentFailuresSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-32 h-6" />
          <Skeleton className="w-5 h-5 rounded-full" />
        </div>
        <Skeleton className="w-16 h-4" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Skeleton className="w-4 h-4 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="w-48 h-4 mb-1" />
                <Skeleton className="w-32 h-3 mb-2" />
                <div className="flex items-center gap-2">
                  <Skeleton className="w-14 h-3" />
                  <Skeleton className="w-20 h-3" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Skeleton className="w-12 h-5 rounded-full" />
                <Skeleton className="w-16 h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
