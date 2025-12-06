import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoadingSkeleton() {
  return (
    <div className="px-4 py-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      {/* Grid Layout Skeleton - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Details Skeleton */}
        <div className="space-y-4 border rounded-lg p-6">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        {/* Brand Access Skeleton */}
        <div className="space-y-4 border rounded-lg p-6">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
      {/* Members Section Skeleton - Full Width */}
      <div className="space-y-4 border rounded-lg p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
