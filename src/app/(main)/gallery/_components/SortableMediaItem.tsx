"use client";

import type React from "react";
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
interface SortableMediaItemProps {
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
  isDraggable: boolean;
}

// Main SortableMediaItem Component
export function SortableMediaItem({
  item,
  isSelected,
  isHovered,
  isMediaSelectDialog = false,
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
  isDraggable,
}: SortableMediaItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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

  const handleImageClick = () => {
    if (isMediaSelectDialog && !isDisabled) {
      onSelect(item.id, !isSelected);
    } else if (!isMediaSelectDialog) {
      onEditClick(item);
    }
  };

  const aspectRatio = dimensions.width / dimensions.height || 1;
  const skeletonHeight = item.dimensions?.height
    ? Math.min(item.dimensions.height / 4, 400)
    : Math.floor(Math.random() * 200) + 200;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-4 relative group overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ${
        isDragging ? "opacity-50 z-50" : ""
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...(isDraggable ? attributes : {})}
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
            onEditClick={handleImageClick}
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

        {/* Dark overlay for better drag handle visibility - only show on hover when draggable */}
        {isDraggable && !isMediaSelectDialog && isHovered && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 pointer-events-none" />
        )}

        {/* Actions button for non-dialog mode */}
        {!isMediaSelectDialog && isHovered && (
          <div className="absolute top-2 right-2 z-20">
            <Popover>
              <PopoverTrigger asChild>
                <TooltipIconButton
                  tooltip="More Actions"
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white"
                >
                  <MoreIcon />
                </TooltipIconButton>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="end">
                <MediaItemActionsButton
                  item={item}
                  onDelete={onDelete}
                  onDownload={onDownload}
                  onDetailsClick={onDetailsClick}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Drag handle for non-dialog mode - same style as A2iImageCard */}
        {isDraggable && !isMediaSelectDialog && isHovered && (
          <div
            {...listeners}
            className="w-16 h-1 bg-white rounded-full cursor-grab hover:w-20 transition-all top-2 -translate-x-1/2 left-1/2 absolute z-20 opacity-60 hover:opacity-100"
          />
        )}
      </div>
    </div>
  );
}
