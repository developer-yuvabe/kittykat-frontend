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
    <div className="flex-1 p-6 relative flex items-center justify-center min-h-0">
      <div className="w-full h-full flex items-center justify-center">
        <ZoomableImage
          src={item.asset_url}
          key={item.asset_url}
          className="object- rounded-lg max-w-full max-h-full"
          variant="overlay"
          isLiked={item.is_favourite}
          onLike={() => galleryActions.toggleFavorite(item.id)}
        />
      </div>
    </div>
  );
};
