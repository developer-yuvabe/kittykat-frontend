"use client";

import type React from "react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { GalleryItemResponse } from "@/types/gallery.types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { MoreIcon } from "@/components/ui/custom-icon";
import { MediaOverlay } from "./MediaOverlay";
import { MediaImage } from "./MediaImage";
import { MediaItemActionsButton } from "./MediaItemActionsButton";
import { GalleryActions } from "@/hooks/useGallery";

// Types
interface MediaItemProps {
  item: GalleryItemResponse;
  isSelected: boolean;
  isHovered: boolean;
  isMediaSelectDialog?: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onDownload: (item: GalleryItemResponse, e: React.MouseEvent) => void;
  onDetailsClick: (item: GalleryItemResponse) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  inSelectionGalleryIds?: string[];
  isMultiSelect?: boolean;
  selectedCount?: number;
  maxSelectionCount?: number;
  galleryActions: GalleryActions;
  onEditClick: (item: GalleryItemResponse) => void;
}

// Main MediaItem Component
export function MediaItem({
  item,
  isSelected,
  isHovered,
  isMediaSelectDialog = false, // Default to false
  onSelect,
  onDelete,
  onDownload,
  onDetailsClick,
  onMouseEnter,
  onMouseLeave,
  inSelectionGalleryIds,
  isMultiSelect,
  selectedCount,
  maxSelectionCount,
  galleryActions,
  onEditClick,
}: MediaItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });

  const isAlreadySelected = (inSelectionGalleryIds ?? []).includes(item.id);
  const isDisabled = isAlreadySelected && isMultiSelect;

  const handleImageLoad = (event: any) => {
    const target = event.target as HTMLImageElement;
    setDimensions({
      width: target.naturalWidth,
      height: target.naturalHeight,
    });
    setIsLoaded(true);
  };

  // Handle image click - either select or edit based on context
  const handleImageClick = () => {
    if (isMediaSelectDialog) {
      // In media select dialog, clicking image should select it
      if (!isAlreadySelected) {
        onSelect(item.id, !isSelected);
      }
    } else {
      // In regular gallery, clicking image opens editor
      onEditClick(item);
    }
  };

  const aspectRatio = dimensions.width / dimensions.height;
  const skeletonHeight = item.dimensions
    ? (300 * item.dimensions.height) / item.dimensions.width
    : Math.floor(Math.random() * 200) + 200;

  return (
    <div
      className="mb-4 relative group overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {!isLoaded && (
        <div className="w-full">
          <Skeleton
            className="w-full rounded-lg"
            style={{ height: `${skeletonHeight}px` }}
          />
        </div>
      )}

      <div
        className={`relative w-full transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0 absolute"
        }`}
        style={{
          paddingBottom: isLoaded ? `${(1 / aspectRatio) * 100}%` : undefined,
        }}
      >
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <MediaImage
            item={item}
            onImageLoad={handleImageLoad}
            onEditClick={handleImageClick} // Use our custom handler
          />
        </div>

        <MediaOverlay
          item={item}
          isSelected={isSelected}
          isHovered={isHovered}
          isMediaSelectDialog={isMediaSelectDialog}
          onSelect={onSelect}
          isAlreadySelected={isAlreadySelected}
          isDisabled={isDisabled}
          isMultiSelectMode={isMultiSelect}
          maxSelectionCount={maxSelectionCount}
          selectedCount={selectedCount}
          onDownload={onDownload}
          onToggleFavorite={() => {
            galleryActions.patchItem({
              itemId: item.id,
              data: { is_favourite: !item.is_favourite },
            });
          }}
        />

        {/* More options popover - Only show in regular gallery, NOT in media select dialog */}
        {isHovered && isMediaSelectDialog === false && (

          <>
            <div className="absolute top-0 right-1 z-10 flex space-x-1">
              <Popover>
                <PopoverTrigger asChild>
                  <TooltipIconButton
                    tooltip="More"
                    className="hover:bg-black/50 "
                  >
                    <MoreIcon size={24} color="#ffffff" />
                  </TooltipIconButton>
                </PopoverTrigger>
                <PopoverContent
                  className="w-72 h-max max-h-128 overflow-auto p-2"
                  side="right"
                >
                  <div className="space-y-2">
                    <MediaItemActionsButton
                      item={item}
                      onDetailsClick={onDetailsClick}
                      onDownload={onDownload}
                      onDelete={onDelete}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}
      </div>
    </div>
  );
}