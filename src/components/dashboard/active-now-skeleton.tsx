import { Skeleton } from "@/components/ui";

export default function ActiveNowSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-24 h-6" />
        <Skeleton className="w-3 h-3 rounded-full" />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="w-24 h-5 rounded-full" />
              <Skeleton className="w-12 h-4" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-32 h-4" />
            </div>
            <Skeleton className="w-full h-2 rounded-full mb-2" />
            <Skeleton className="w-28 h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
