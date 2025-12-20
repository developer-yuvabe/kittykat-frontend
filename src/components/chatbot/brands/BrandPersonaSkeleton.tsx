import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BrandPersonaSkeleton() {
  return (
    <Card className="relative overflow-hidden w-full h-[850px] flex flex-col">
      {/* Image Skeleton */}
      <Skeleton className="w-full h-64 flex-shrink-0" />

      {/* Header Skeleton */}
      <CardHeader className="border-b flex-shrink-0 pb-3 space-y-2">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>

      {/* Content Skeleton */}
      <CardContent className="space-y-4 pt-4 flex-1">
        {/* Identity Snapshot */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full col-span-2" />
          </div>
        </div>

        {/* Composition */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>

        {/* Additional Details */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-18 rounded-md" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </CardContent>

      {/* Bottom Button Skeleton */}
      <div className="px-2 pb-2 pt-2 mt-auto flex justify-end">
        <Skeleton className="h-9 w-24" />
      </div>
    </Card>
  );
}
