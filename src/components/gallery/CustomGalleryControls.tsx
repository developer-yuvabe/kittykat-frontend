"use client";

import type React from "react";
import type { Photo } from "react-photo-album";
import { moodboardGridLayouts } from "@/lib/moodboard.utils";
import type { SortablePhoto } from "./CustomGalleryContainer";
import { BrushCleaning } from "lucide-react";
import { TooltipIconButton } from "../thread/tooltip-icon-button";

interface CustomGalleryControlsProps<TPhoto extends Photo> {
  photosLength: number;
  noOfImagesForMoodboard: number;
  setNoOfImagesForMoodboard: React.Dispatch<React.SetStateAction<number>>;
  setPhotos: React.Dispatch<React.SetStateAction<SortablePhoto<TPhoto>[]>>;
  setPlaceholderItems: React.Dispatch<
    React.SetStateAction<SortablePhoto<Photo>[]>
  >;
  minImagesRequired: number;
  placeholderItems: SortablePhoto<Photo>[];
}

export function CustomGalleryControls<TPhoto extends Photo>({
  photosLength,
  noOfImagesForMoodboard,
  setNoOfImagesForMoodboard,
  setPhotos,
  setPlaceholderItems,
  minImagesRequired,
  placeholderItems,
}: CustomGalleryControlsProps<TPhoto>) {
  const maxImages = Math.max(...Object.keys(moodboardGridLayouts).map(Number));

  const handleIncreaseImages = () => {
    if (noOfImagesForMoodboard < maxImages) {
      setNoOfImagesForMoodboard(noOfImagesForMoodboard + 1);
    }
  };

  const handleDecreaseImages = () => {
    setPlaceholderItems((prevPlaceholders) => {
      if (prevPlaceholders.length > 0) {
        // Remove the last placeholder
        const updatedPlaceholders = [...prevPlaceholders];
        updatedPlaceholders.pop();

        // Reduce the moodboard image count
        setNoOfImagesForMoodboard((prev) => prev - 1);
        return updatedPlaceholders;
      }

      // If no placeholders, then remove an actual photo
      setPhotos((prevPhotos) => {
        if (prevPhotos.length === 0) return prevPhotos;

        const updatedPhotos = [...prevPhotos];
        updatedPhotos.pop();

        // Reduce the moodboard image count
        setNoOfImagesForMoodboard((prev) => prev - 1);

        return updatedPhotos;
      });

      return prevPlaceholders;
    });
  };

  const canIncreaseImages = noOfImagesForMoodboard < maxImages;
  const canDecreaseImages = noOfImagesForMoodboard > minImagesRequired;

  return (
    <div className="flex items-center gap-4 mt-4">
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
      {photosLength > 10 && placeholderItems.length > 0 && (
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
      )}
    </div>
  );
}
