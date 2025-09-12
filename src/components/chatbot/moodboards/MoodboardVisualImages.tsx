"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { ImageModal } from "@/components/shared/ImageModal";
import { MoodboardInformation } from "@/types/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { DraggableCarouselItem } from "./DraggableCarouselItem";
import { GalleryActions } from "@/hooks/useGallery";
import { Loader2 } from "lucide-react";
import { type CarouselApi } from "@/components/ui/carousel";
import Image from "next/image";

interface MoodboardVisualImagesProps {
  currentMoodboard: MoodboardInformation;
  galleryActions: GalleryActions;
  title?: string;
}

export const MoodboardVisualImages: React.FC<MoodboardVisualImagesProps> = ({
  currentMoodboard,
  galleryActions,
}) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);
  const [api, setApi] = useState<CarouselApi>();

  const galleryItems = galleryActions.getGalleryItems();
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = galleryActions;

  // Memoized images array
  const images = useMemo(() => {
    if (!currentMoodboard || !galleryItems) return [];

    return galleryItems.map((item) => {
      return {
        id: item.id,
        filename: item.asset_title ?? "Untitled",
        url: item.preview_url || item.asset_url,
        galleryItem: item,
      };
    });
  }, [currentMoodboard?.id, galleryItems]);

  // Handle carousel scroll and fetch more when approaching the end
  const handleCarouselScroll = useCallback(() => {
    if (!api || !hasNextPage || isFetchingNextPage) return;

    const scrollProgress = api.scrollProgress();
    const canScrollNext = api.canScrollNext();

    // Fetch more when we're 80% through the carousel or can't scroll next
    if (scrollProgress > 0.8 || !canScrollNext) {
      fetchNextPage();
    }
  }, [api, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Set up Embla carousel event listeners
  useEffect(() => {
    if (!api) return;

    // Listen for scroll events
    api.on("scroll", handleCarouselScroll);

    // Also check on select (when user navigates)
    api.on("select", handleCarouselScroll);

    return () => {
      api.off("scroll", handleCarouselScroll);
      api.off("select", handleCarouselScroll);
    };
  }, [api, handleCarouselScroll]);

  // Initial fetch when component mounts
  useEffect(() => {
    if (currentMoodboard && !hasInitiallyFetched && images.length === 0) {
      fetchNextPage();
      setHasInitiallyFetched(true);
    }
  }, [currentMoodboard, hasInitiallyFetched, images.length, fetchNextPage]);

  if (!images || images.length === 0) {
    return (
      <div className="mb-6 mt-3">
        <div className="flex items-center justify-center p-4">
          <div className="text-sm text-gray-500">
            {galleryActions.isFetching
              ? "Loading images..."
              : "No images available. Please add images to your gallery."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 mt-3 select-none">
      <div className="flex items-center justify-between">
        <Carousel
          className="mx-auto max-w-3xl select-none"
          setApi={setApi}
          opts={{
            align: "start",
            loop: false,
            skipSnaps: false,
            dragFree: true, // Allows free scrolling
          }}
        >
          <div className="select-none">
            <CarouselContent className="select-none">
              {images.map((item) => (
                <CarouselItem
                  key={item.id}
                  className={`select-none ${
                    images.length < 5 ? `basis-1/${images.length}` : "basis-1/5"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <DraggableCarouselItem
                    item={item.galleryItem}
                    className="block w-full select-none"
                  >
                    <Image
                      onClick={(e) => {
                        if (e.defaultPrevented) return;
                        setExpandedImage(item.url);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      src={item.url || "/placeholder.svg"}
                      alt={item.filename}
                      className="object-cover w-40 mx-auto h-40 rounded-md cursor-pointer hover:scale-105 transition-transform duration-200 select-none"
                      loading="lazy"
                      draggable={false}
                      quality={20}
                      width={160}
                      height={160}
                    />
                  </DraggableCarouselItem>
                </CarouselItem>
              ))}

              {/* Loading indicator for next page */}
              {isFetchingNextPage && (
                <CarouselItem className="basis-1/5 select-none">
                  <div className="flex items-center justify-center w-40 h-40 mx-auto rounded-md bg-gray-100 select-none">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-500"></div>
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
          </div>

          <CarouselPrevious
            className="select-none"
            onMouseDown={(e) => e.preventDefault()}
          />

          {/* Hide CarouselNext when loading or no more items */}
          {!isFetchingNextPage ? (
            <CarouselNext
              className="select-none"
              onMouseDown={(e) => e.preventDefault()}
            />
          ) : (
            <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center justify-center w-10 h-10 select-none">
              {isFetchingNextPage && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
            </div>
          )}
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
