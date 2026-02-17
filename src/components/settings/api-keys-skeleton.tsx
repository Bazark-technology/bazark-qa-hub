import {
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";

const skeletonRows = [
  { label: "w-36", key: "w-52", badge: "w-16", created: "w-24", lastUsed: "w-20" },
  { label: "w-28", key: "w-48", badge: "w-14", created: "w-20", lastUsed: "w-16" },
  { label: "w-40", key: "w-44", badge: "w-16", created: "w-28", lastUsed: "w-20" },
  { label: "w-32", key: "w-56", badge: "w-14", created: "w-24", lastUsed: "w-18" },
];

export default function ApiKeysSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Label</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skeletonRows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className={`h-5 ${row.label}`} />
                </TableCell>
                <TableCell>
                  <Skeleton className={`h-5 ${row.key}`} />
                </TableCell>
                <TableCell>
                  <Skeleton className={`h-6 ${row.badge} rounded-full`} />
                </TableCell>
                <TableCell>
                  <Skeleton className={`h-5 ${row.created}`} />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className={`h-5 ${row.lastUsed}`} />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
