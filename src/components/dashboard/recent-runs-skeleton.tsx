import { Skeleton } from "@/components/ui";

export default function RecentRunsSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-36 h-6" />
        <Skeleton className="w-16 h-4" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="w-4 h-4 rounded-full flex-shrink-0" />
            <div className="flex-1 flex items-center gap-2">
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-48 h-4" />
            </div>
            <Skeleton className="w-20 h-5 rounded-full hidden sm:block" />
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-12 h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
