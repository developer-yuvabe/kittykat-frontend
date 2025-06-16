// ManualMoodboardSkeleton.tsx

import { Button } from "@/components/ui/button";
import { ChartNoAxesCombined } from "lucide-react";
import React from "react";

const ManualMoodboardSkeleton: React.FC = () => {
  return (
    <>
      {/* Moodboard Grid */}
      <div className="grid grid-cols-4 gap-4 pb-4">
        {/* Item 1: Large left vertical block */}
        <div className="col-span-1 row-span-2 bg-gray-200 rounded-md min-h-60"></div>

        {/* Item 2: Top middle horizontal block */}
        <div className="col-span-2 bg-gray-200 rounded-md min-h-28"></div>

        {/* Item 3: Right large vertical block */}
        <div className="col-span-1 row-span-2 bg-gray-200 rounded-md min-h-60"></div>

        {/* Item 4: Bottom left 1 */}
        <div className="col-span-1 bg-gray-200 rounded-md min-h-28"></div>

        {/* Item 5: Middle left (under item 2) */}
        <div className="col-span-1 bg-gray-200 rounded-md min-h-28"></div>

        {/* Item 6: Middle right (under item 3) */}
        <div className="col-span-1 bg-gray-200 rounded-md min-h-28"></div>

        {/* Item 7: Bottom center horizontal block */}
        <div className="col-span-2 bg-gray-200 rounded-md min-h-28"></div>

        {/* Item 8: Bottom right */}
        <div className="col-span-1 bg-gray-200 rounded-md min-h-28"></div>
      </div>

      {/* Moodboard Analysis Placeholder */}

      <Button
        disabled
        className="w-full py-3 text-lg font-medium  bg-purple-600 hover:bg-purple-700"
      >
        <ChartNoAxesCombined /> Moodboard Analysis
      </Button>
    </>
  );
};

export default ManualMoodboardSkeleton;
