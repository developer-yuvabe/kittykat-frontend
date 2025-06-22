"use client";

import React, { useState, useMemo } from "react";
import { ImageModal } from "@/components/shared/ImageModal";
import { MoodboardInformation } from "@/types/types";
import { GalleryItemResponse } from "@/types/gallery.types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface MoodboardVisualImagesProps {
  currentMoodboard: MoodboardInformation;
  galleryItems: GalleryItemResponse[];
  title?: string;
}

export const MoodboardVisualImages: React.FC<MoodboardVisualImagesProps> = ({
  currentMoodboard,
  galleryItems,
}) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Memoized images array with proper dependencies
  const images = useMemo(() => {
    if (!currentMoodboard || !galleryItems) return [];

    return galleryItems.map((item) => {
      // Find the corresponding visual image by id
      const visualImage = currentMoodboard.visual_style_images.find(
        (img) => img.gallery_item_id === item.id
      );

      return {
        id: item.id,
        filename: item.asset_title ?? "Untitled",
        url: item.asset_url,
        source: item.asset_source,
        is_liked: visualImage?.is_liked ?? false,
        ignored: visualImage?.to_ignore ?? false,
      };
    });
  }, [
    currentMoodboard?.id,
    currentMoodboard?.visual_style_images,
    galleryItems,
  ]);

  // Debug logging to track changes
  React.useEffect(() => {
    console.log("MoodboardVisualImages - Data changed:", {
      moodboardId: currentMoodboard?.id,
      visualStyleImagesCount: currentMoodboard?.visual_style_images?.length,
      galleryItemsCount: galleryItems?.length,
      processedImagesCount: images.length,
      visualStyleImages: currentMoodboard?.visual_style_images,
    });
  }, [currentMoodboard?.visual_style_images, galleryItems, images]);

  if (!images || images.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <Carousel className="mx-auto max-w-3xl">
          <div className="">
            <CarouselContent>
              {images.map((item) => (
                <CarouselItem
                  key={`${item.id}-${item.is_liked}-${item.ignored}`} // Better key for re-rendering
                  className={`${
                    images.length < 5 ? `basis-1/${images.length}` : "basis-1/5"
                  }`}
                >
                  <div className="relative">
                    <img
                      onClick={() => setExpandedImage(item.url)}
                      src={item.url || "/placeholder.svg"}
                      alt={item.filename}
                      className={`object-cover w-40 mx-auto h-40 rounded-md cursor-pointer transition-all duration-200 ${
                        item.ignored ? "opacity-50 grayscale" : ""
                      } ${item.is_liked ? "ring-2 ring-green-500" : ""}`}
                      loading="lazy"
                    />
                    {/* Visual indicators for liked/ignored status */}
                    {item.is_liked && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        ♥
                      </div>
                    )}
                    {item.ignored && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        ✕
                      </div>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </div>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {expandedImage && (
        <ImageModal
          isOpen={!!expandedImage}
          imageUrl={expandedImage}
          alt="Expanded visual image"
          onClose={() => setExpandedImage(null)}
        />
      )}
    </div>
  );
};
