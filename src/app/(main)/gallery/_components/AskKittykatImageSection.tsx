"use client";

import React from "react";
import ZoomableImage from "@/components/ui/zoomable-image";
import { GalleryItemResponse } from "@/types/gallery.types";
import { GalleryActions } from "@/hooks/useGallery";

import { useUndoRedoRemix } from "@/hooks/useUndoRedoRemix"; // Assuming used in parent
import RemixImage from "../../_components/remix/RemixImage";

interface AskKittykatImageSectionProps {
  item: GalleryItemResponse;
  galleryActions: GalleryActions;
  isRemixEnabled: boolean;
  imageRef?: React.RefObject<HTMLImageElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  offScreenCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  remixHistory?: ReturnType<typeof useUndoRedoRemix>;
  brushSize?: number;
}

export const AskKittykatImageSection: React.FC<
  AskKittykatImageSectionProps
> = ({
  item,
  galleryActions,
  isRemixEnabled,
  imageRef,
  canvasRef,
  offScreenCanvasRef,
  remixHistory,
  brushSize = 20,
}) => {
  return (
    <div className="flex-1 p-6 relative flex items-center justify-center min-h-0">
      <div className="w-full h-[80%] flex items-center justify-center">
        {isRemixEnabled &&
        remixHistory &&
        imageRef &&
        canvasRef &&
        offScreenCanvasRef ? (
          <RemixImage
            imageRef={imageRef}
            canvasRef={canvasRef}
            offScreenCanvasRef={offScreenCanvasRef}
            url={item.asset_url}
            remixHistory={remixHistory}
            brushSize={brushSize}
          />
        ) : (
          <ZoomableImage
            src={item.asset_url}
            key={item.asset_url}
            className="object-contain rounded-lg max-h-[80vh]"
            variant="overlay"
            isLiked={item.is_favourite}
            onLike={() => galleryActions.toggleFavorite(item.id)}
          />
        )}
      </div>
    </div>
  );
};
