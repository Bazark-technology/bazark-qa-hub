import { Skeleton } from "@/components/ui";

export default function PassRateChartSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="w-32 h-6" />
          <Skeleton className="w-24 h-4" />
        </div>
        <Skeleton className="w-24 h-9 rounded-lg" />
      </div>
      <div className="h-[300px] flex items-end gap-2 pt-8">
        {[40, 65, 55, 80, 70, 90, 85, 60, 75, 88, 72, 95, 82, 78].map((h, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: h + "%" }}
          />
        ))}
      </div>
    </div>
  );
}
