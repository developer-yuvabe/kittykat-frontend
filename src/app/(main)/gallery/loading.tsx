"use client";

import { Skeleton } from "@/components/ui/skeleton";
import MediaSkeletonGrid from "./_components/MediaSkeletonGrid";

export default function MediaLibrarySkeleton() {
  return (
    <div className="flex flex-col w-full mx-auto">
      {/* Sticky Header */}
      <div className="flex justify-between mb-2 sticky top-24 bg-[#F3F4F6FF] pt-4 pb-2 z-50">
        <div className="flex flex-row gap-x-4">
          <Skeleton className="h-8 w-40" /> {/* Media library title */}
          <Skeleton className="h-10 w-80" /> {/* Brand selector */}
        </div>
        <Skeleton className="h-10 w-[130px]" /> {/* View selector */}
      </div>

      {/* Sticky Tabs */}
      <div className="sticky top-44 bg-[#F3F4F6FF] pt-2 pb-4 z-40">
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-32" />
          ))}
        </div>
      </div>

      {/* Upload Dropzone placeholder */}
      <Skeleton className="h-32 w-full rounded-xl mt-3" />

      {/* Filters + Grid */}
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        {/* Main Grid Area */}
        <div className="w-full space-y-6 p-3 rounded-3xl bg-white">
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
