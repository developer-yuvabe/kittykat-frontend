"use client";

import React from "react";
import ZoomableImage from "@/components/ui/zoomable-image";
import { GalleryItemResponse } from "@/types/gallery.types";
import { GalleryActions } from "@/hooks/useGallery";

interface AskKittykatImageSectionProps {
  item: GalleryItemResponse;
  galleryActions: GalleryActions;
}

export const AskKittykatImageSection: React.FC<
  AskKittykatImageSectionProps
> = ({ item, galleryActions }) => {
  return (
    <div className="flex-1 p-6 relative flex items-center justify-center">
      <div className="w-[80%] h-[80%] flex items-center justify-center">
        <ZoomableImage
          src={item.asset_url}
          key={item.asset_url}
          className="object-contain rounded-lg shadow-lg max-h-full max-w-full"
          variant="overlay"
          isLiked={item.is_favourite}
          onLike={() => galleryActions.toggleFavorite(item.id)}
        />
      </div>
    </div>
  );
};
