// ManualMoodboardSkeleton.tsx

import { Button } from "@/components/ui/button";
import { ChartNoAxesCombined } from "lucide-react";
import React from "react";

interface ManualMoodboardSkeletonProps {
  shimmer?: boolean;
  showButton?: boolean;
}

const ManualMoodboardSkeleton: React.FC<ManualMoodboardSkeletonProps> = ({
  shimmer = false,
  showButton = true,
}) => {
  const shimmerClass = shimmer ? "animate-pulse" : "";

  return (
    <>
      {/* Moodboard Grid */}
      <div className="grid grid-cols-4 gap-4 pb-4">
        <div
          className={`col-span-1 row-span-2 bg-gray-200 rounded-md min-h-60 ${shimmerClass}`}
        />
        <div
          className={`col-span-2 bg-gray-200 rounded-md min-h-28 ${shimmerClass}`}
        />
        <div
          className={`col-span-1 row-span-2 bg-gray-200 rounded-md min-h-60 ${shimmerClass}`}
        />
        <div
          className={`col-span-1 bg-gray-200 rounded-md min-h-28 ${shimmerClass}`}
        />
        <div
          className={`col-span-1 bg-gray-200 rounded-md min-h-28 ${shimmerClass}`}
        />
        <div
          className={`col-span-1 bg-gray-200 rounded-md min-h-28 ${shimmerClass}`}
        />
        <div
          className={`col-span-2 bg-gray-200 rounded-md min-h-28 ${shimmerClass}`}
        />
        <div
          className={`col-span-1 bg-gray-200 rounded-md min-h-28 ${shimmerClass}`}
        />
      </div>

      {/* Moodboard Analysis Placeholder */}
      {showButton && (
        <Button
          disabled
          className="w-full py-3 text-lg font-medium bg-purple-600 hover:bg-purple-700"
        >
          <ChartNoAxesCombined /> Moodboard Analysis
        </Button>
      )}
    </>
  );
};

export default ManualMoodboardSkeleton;
