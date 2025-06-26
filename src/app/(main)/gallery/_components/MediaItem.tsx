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
import { MediaItemCommentSection } from "./MediaItemCommentSection";
import { MediaItemEditableTitle } from "./MediaItemEditableTitle";
import { MediaImage } from "./MediaImage";
import { MediaItemActionsButton } from "./MediaItemActionsButton";
import { MediaImageDetails } from "./MediaImageDetails";
import { GalleryActions } from "@/hooks/useGallery";
import { createMediaItemHelper } from "@/lib/gallery.utils";

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
  isMediaSelectDialog,
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

  const mediaHelper = createMediaItemHelper({
    patchItem: galleryActions.patchItem,
    addComment: galleryActions.addComment,
    updateComment: galleryActions.updateComment,
    deleteComment: galleryActions.deleteComment,
    toggleFavorite: galleryActions.toggleFavorite,
    bulkDelete: galleryActions.bulkDelete,
    deleteItem: galleryActions.deleteItem,
  });

  const handleImageLoad = (event: any) => {
    const target = event.target as HTMLImageElement;
    setDimensions({
      width: target.naturalWidth,
      height: target.naturalHeight,
    });
    setIsLoaded(true);
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
            onEditClick={onEditClick}
          />
        </div>

        <MediaOverlay
          item={item}
          isSelected={isSelected}
          isHovered={isHovered}
          isMediaSelectDialog={isMediaSelectDialog}
          onSelect={onSelect}
          onToggleFavorite={mediaHelper.toggleFavorite}
          isAlreadySelected={isAlreadySelected}
          isDisabled={isDisabled}
          isMultiSelectMode={isMultiSelect}
          maxSelectionCount={maxSelectionCount}
          selectedCount={selectedCount}
        />

        {/* More options popover */}
        {isHovered && (
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
                    <MediaItemEditableTitle
                      item={item}
                      onUpdateTitle={mediaHelper.editTitle}
                    />

                    <MediaImageDetails item={item} />

                    <MediaItemCommentSection
                      item={item}
                      onUpdateComment={mediaHelper.updateComment}
                      onDeleteComment={mediaHelper.deleteComment}
                      onAddComment={mediaHelper.addComment}
                    />

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
