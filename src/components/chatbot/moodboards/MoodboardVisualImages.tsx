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
      return {
        id: item.id,
        filename: item.asset_title ?? "Untitled",
        url: item.preview_url || item.asset_url,
      };
    });
  }, [currentMoodboard?.id, galleryItems]);

  if (!images || images.length === 0) return null;

  return (
    <div className="mb-6 mt-3">
      <div className="flex items-center justify-between">
        <Carousel className="mx-auto max-w-3xl">
          <div className="">
            <CarouselContent>
              {images.map((item) => (
                <CarouselItem
                  key={`${item.id}`} // Better key for re-rendering
                  className={`${
                    images.length < 5 ? `basis-1/${images.length}` : "basis-1/5"
                  }`}
                >
                  <img
                    onClick={() => setExpandedImage(item.url)}
                    src={item.url || "/placeholder.svg"}
                    alt={item.filename}
                    className="object-cover w-40 mx-auto h-40 rounded-md cursor-pointer"
                    loading="eager"
                  />
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
