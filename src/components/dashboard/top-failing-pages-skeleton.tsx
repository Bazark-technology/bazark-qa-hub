import { Skeleton } from "@/components/ui";

export default function TopFailingPagesSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-4">
        <Skeleton className="w-36 h-6 mb-1" />
        <Skeleton className="w-20 h-4" />
      </div>
      <div className="space-y-4">
        {[80, 65, 50, 35, 20].map((width, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-4" />
                <Skeleton className="w-32 h-4" />
              </div>
              <Skeleton className="w-6 h-4" />
            </div>
            <div className="ml-7">
              <Skeleton className="h-2 rounded-full" style={{ width: width + "%" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
