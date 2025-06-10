"use client";

import { Skeleton } from "@/components/ui/skeleton";
import MediaSkeletonGrid from "./_components/MediaSkeletonGrid";

export default function MediaLibrarySkeleton() {
  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto relative gap-6">
      {/* Header + Tabs */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="flex gap-4 justify-between">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-8 w-60" />
          ))}
        </div>
      </div>

      {/* Upload Dropzone placeholder */}
      <Skeleton className="h-32 w-full rounded-xl" />

      {/* Filters + Grid */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Main Grid Area */}
        <div className="w-full  space-y-6">
          {/* Gallery grid */}
          <MediaSkeletonGrid />

          {/* Infinite scroll loader */}
          <div className="flex justify-center py-8">
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
