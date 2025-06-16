"use client";

import React, { useState, useEffect } from "react";
import EmblaCarousel from "@/components/ui/embla-carousel";
import { ImageModal } from "@/components/shared/ImageModal";
import { Skeleton } from "@/components/ui/skeleton"; // Assuming you use shadcn/ui
import { Loader } from "lucide-react"; // Or any spinner
import { VisualImage } from "@/types/campaign.types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ManualCampaigVisualImagesProps {
  images: VisualImage[];
  title?: string;
}

export const ManualCampaigVisualImages: React.FC<
  ManualCampaigVisualImagesProps
> = ({ images, title = "Visual Images" }) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>

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
