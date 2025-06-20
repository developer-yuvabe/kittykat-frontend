"use client";

import React, { useState } from "react";
import { ImageModal } from "@/components/shared/ImageModal";
import { VisualImage } from "@/types/campaign.types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface MoodboardVisualImagesProps {
  images: VisualImage[];
  title?: string;
}

export const MoodboardVisualImages: React.FC<MoodboardVisualImagesProps> = ({
  images,
}) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <Carousel className="mx-auto max-w-3xl">
          <div className="">
            <CarouselContent>
              {images.map((item, index) => (
                <CarouselItem
                  key={index}
                  className={`${
                    images.length < 5 ? `basis-1/${images.length}` : "basis-1/5"
                  }`}
                >
                  <img
                    onClick={() => setExpandedImage(item.url)}
                    src={item.url || "/placeholder.svg"}
                    alt={item.filename}
                    className="object-cover w-40 mx-auto h-40 rounded-md cursor-pointer"
                    loading="lazy"
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
