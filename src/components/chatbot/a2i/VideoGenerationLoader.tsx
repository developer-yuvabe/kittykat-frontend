import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const VideoGenerationLoader = () => {
  return (
    <div className="flex flex-col gap-y-6">
      <Skeleton className="w-full h-10" />
      <Skeleton className="w-full h-10" />
      <Skeleton className="w-full h-10" />
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 flex-1" />
        ))}
      </div>
      <Skeleton className="w-full h-14 bg-primary/20" />
    </div>
  );
};

export default VideoGenerationLoader;
