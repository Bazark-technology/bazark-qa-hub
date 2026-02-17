import { Skeleton } from "@/components/ui";

export default function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 border-l-4 border-l-gray-200"
        >
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="mt-4 space-y-2">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-20 h-8" />
            <Skeleton className="w-32 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}
