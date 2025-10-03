"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryItemResponse } from "@/types/gallery.types";

interface MediaBulkAssetPreviewProps {
  selectedItems: GalleryItemResponse[];
}

export function MediaBulkAssetPreview({
  selectedItems,
}: MediaBulkAssetPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : selectedItems.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < selectedItems.length - 1 ? prev + 1 : 0));
  };

  const currentItem = selectedItems[currentIndex];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          Selected Assets Preview
        </h4>
        <span className="text-xs text-gray-500">
          {currentIndex + 1} of {selectedItems.length}
        </span>
      </div>

      <div className="relative bg-gray-100 rounded-lg overflow-hidden border">
        {/* Main Preview Image */}
        <div className="relative w-full aspect-video">
          {currentItem?.asset_url && (
            <Image
              src={currentItem.asset_url}
              alt={`Asset ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          )}
        </div>

        {/* Navigation Arrows */}
        {selectedItems.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md"
              onClick={handleNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {selectedItems.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {selectedItems.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              className={`relative flex-shrink-0 w-16 h-16 rounded border-2 transition-all ${
                idx === currentIndex
                  ? "border-purple-600 ring-2 ring-purple-200"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {item.asset_url && (
                <Image
                  src={item.asset_url}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover rounded"
                  sizes="64px"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
