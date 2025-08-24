"use client";

import type React from "react";
import { moodboardGridLayouts } from "@/lib/moodboard.utils";
import type { UnifiedMoodboardItem } from "@/types/moodboard.types";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { Settings } from "lucide-react";

interface CustomGalleryControlsProps {
  noOfImagesForMoodboard: number;
  setNoOfImagesForMoodboard: React.Dispatch<React.SetStateAction<number>>;
  setItems: React.Dispatch<React.SetStateAction<UnifiedMoodboardItem[]>>;
  minImagesRequired: number;
  showLiked: boolean;
  setShowLiked: (value: boolean) => void;
  showAdvancedSettings?: boolean;
  setShowAdvancedSettings?: React.Dispatch<React.SetStateAction<boolean>>;
  hasTags: boolean;
}

export function CustomGalleryControls({
  noOfImagesForMoodboard,
  setNoOfImagesForMoodboard,
  setItems,
  minImagesRequired,
  showLiked,
  setShowLiked,
  showAdvancedSettings = false,
  setShowAdvancedSettings,
  hasTags,
}: CustomGalleryControlsProps) {
  const maxImages = Math.max(...Object.keys(moodboardGridLayouts).map(Number));

  const handleIncreaseImages = () => {
    if (noOfImagesForMoodboard < maxImages) {
      setNoOfImagesForMoodboard(noOfImagesForMoodboard + 1);
    }
  };

  const handleDecreaseImages = () => {
    if (noOfImagesForMoodboard > minImagesRequired) {
      setItems((prevItems: UnifiedMoodboardItem[]) => {
        // Find the last item and remove it
        const updatedItems = [...prevItems];
        if (updatedItems.length > 0) {
          updatedItems.pop();
        }
        return updatedItems;
      });
      setNoOfImagesForMoodboard((prev: number) => prev - 1);
    }
  };

  const canIncreaseImages = noOfImagesForMoodboard < maxImages;
  const canDecreaseImages = noOfImagesForMoodboard > minImagesRequired;

  return (
    <div className="flex justify-between mt-4">
      <div className="flex items-center gap-4 ">
        {/* Label */}
        <span className="text-lg font-semibold text-gray-900">Images</span>

        {/* Control container */}
        <div className="flex items-center border border-gray-200 rounded-sm overflow-hidden">
          {/* Minus button */}
          <button
            onClick={handleDecreaseImages}
            disabled={!canDecreaseImages}
            className="h-8 w-8 flex items-center justify-center m-1 rounded-sm bg-gray-300 text-gray-600 disabled:opacity-50"
          >
            <span className="text-lg font-bold">-</span>
          </button>

          {/* Number */}
          <div className="h-8 w-8 flex items-center justify-center text-lg font-medium text-gray-900">
            {noOfImagesForMoodboard}
          </div>

          {/* Plus button */}
          <button
            onClick={handleIncreaseImages}
            disabled={!canIncreaseImages}
            className="h-8 w-8 flex items-center justify-center m-1 bg-[#636AE8FF] rounded-sm text-white font-bold disabled:opacity-50"
          >
            +
          </button>
        </div>
        {/* {photosLength > 10 && placeholderItems.length > 0 && (
          <TooltipIconButton
            onClick={() => {
              setPlaceholderItems([]);
              setNoOfImagesForMoodboard(photosLength);
            }}
            tooltip={"Remove Placholders"}
            variant={"default"}
            className="h-9 w-9 bg-[#636AE8FF]"
            size="icon"
          >
            <BrushCleaning />
          </TooltipIconButton>
        )} */}
      </div>
      <div className="flex items-center gap-2 ml-4">
        <span className="text-sm font-medium text-gray-900">Show Liked</span>
        <Switch
          checked={showLiked}
          onCheckedChange={setShowLiked}
          className="data-[state=checked]:bg-[#636AE8FF]"
        />
        {hasTags && (
          <Button
            variant={showAdvancedSettings ? "outline" : "default"}
            onClick={() => {
              setShowAdvancedSettings?.(!showAdvancedSettings);
            }}
          >
            <Settings /> Advanced Settings
          </Button>
        )}
      </div>
    </div>
  );
}
