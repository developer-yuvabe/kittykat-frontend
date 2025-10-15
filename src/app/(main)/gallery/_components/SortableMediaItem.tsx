"use client";

import type React from "react";
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Skeleton } from "@/components/ui/skeleton";
import type { GalleryItemResponse } from "@/types/gallery.types";
import { MediaOverlay } from "./MediaOverlay";
import { MediaImage } from "./MediaImage";
import { GalleryActions } from "@/hooks/useGallery";
import { ImageModal } from "@/components/shared/ImageModal";
import { handleDownloadImage } from "@/lib/utils";

// Types
interface SortableMediaItemProps {
  item: GalleryItemResponse;
  isSelected: boolean;
  isHovered: boolean;
  isMediaSelectDialog?: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onDownload: (item: GalleryItemResponse, e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  inSelectionGalleryIds?: string[];
  isMultiSelect?: boolean;
  selectedCount?: number;
  maxSelectionCount?: number;
  galleryActions: GalleryActions;
  onEditClick: (item: GalleryItemResponse) => void;
  onEditMoodboard?: (item: GalleryItemResponse) => void;
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
  onMouseEnter,
  onMouseLeave,
  inSelectionGalleryIds,
  isMultiSelect,
  selectedCount,
  maxSelectionCount,
  galleryActions,
  onEditClick,
  onEditMoodboard,
  isDraggable,
}: SortableMediaItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });
  const [showImageModal, setShowImageModal] = useState(false);

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
      setShowImageModal(true); // Show ImageModal instead of details
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowImageModal(true);
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
      } ${isMediaSelectDialog && !isDisabled ? "cursor-pointer" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={
        isMediaSelectDialog && !isDisabled ? handleImageClick : undefined
      }
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
            onToggleFavorite={() => {
              galleryActions.patchItem({
                itemId: item.id,
                data: { is_favourite: !item.is_favourite },
              });
            }}
            isMediaSelectDialog={isMediaSelectDialog}
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
          onEditClick={onEditClick}
          onDelete={onDelete}
          onEditMoodboard={onEditMoodboard}
          onExpandClick={handleExpandClick}
        />

        {/* Dark overlay for better drag handle visibility - only show on hover when draggable */}
        {isDraggable && !isMediaSelectDialog && isHovered && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 pointer-events-none" />
        )}

        {/* Drag handle for non-dialog mode - same style as A2iImageCard */}
        {isDraggable && !isMediaSelectDialog && isHovered && (
          <div
            {...listeners}
            className="w-16 h-1 bg-white rounded-full cursor-grab hover:w-20 transition-all top-2 -translate-x-1/2 left-1/2 absolute z-20 opacity-60 hover:opacity-100"
          />
        )}
      </div>

      {/* Image Modal */}
      <ImageModal
        imageUrl={item.preview_url || item.asset_url || "/placeholder.svg"}
        alt={item.asset_title}
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onDownload={() => handleDownloadImage(item.asset_url)}
        onLike={() => {
          galleryActions.patchItem({
            itemId: item.id,
            data: { is_favourite: !item.is_favourite },
          });
        }}
        isLiked={item.is_favourite}
      />
    </div>
  );
}
