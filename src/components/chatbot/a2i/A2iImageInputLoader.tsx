import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import React from "react";

const A2iImageInputLoader = () => {
  return (
    <div className="space-y-4">
      <div className="relative h-full">
        <Textarea
          className={cn(
            "relative w-full resize-none border-0 focus-visible:ring-0 shadow-none focus scrollbar px-4 pt-4 h-auto min-h-[20px] max-h-[200px] overflow-y-auto align-top"
          )}
          placeholder="Describe what you want to see ..."
        />
      </div>
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-10 h-10" />
          <Skeleton className="w-10 h-10" />
          <Skeleton className="w-10 h-10" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-32 h-10" />
          <Skeleton className="w-32 h-10" />
        </div>
      </div>
    </div>
  );
};

export default A2iImageInputLoader;
