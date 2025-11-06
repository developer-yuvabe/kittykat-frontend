"use client";

import type React from "react";
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  GalleryItemResponse,
  GalleryDragPayload,
} from "@/types/gallery.types";
import { MediaOverlay } from "./MediaOverlay";
import { MediaImage } from "./MediaImage";
import { GalleryActions } from "@/hooks/useGallery";
import { ImageModal } from "@/components/shared/ImageModal";
import { handleDownloadImage } from "@/lib/utils";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";

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
  // New props for drag-to-move functionality
  selectedItems?: string[]; // IDs of selected items
  enableDragToMove?: boolean; // Enable drag-to-move (vs drag-to-reorder)
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
  selectedItems = [],
  enableDragToMove = false,
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
    disabled: !isDraggable, // Enable dnd-kit when isDraggable is true
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isAlreadySelected = (inSelectionGalleryIds ?? []).includes(item.id);
  const isDisabled = isAlreadySelected && isMultiSelect;

  // Handle HTML5 drag start for drag-to-move functionality
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!enableDragToMove) return;

    // Determine which items to include in the drag payload
    let itemsToDrag: string[];
    if (isSelected && selectedItems.length > 0) {
      // If this item is part of the selection, drag all selected items
      itemsToDrag = selectedItems;
    } else {
      // Otherwise, drag only this item
      itemsToDrag = [item.id];
    }

    const payload: GalleryDragPayload = {
      itemIds: itemsToDrag,
      sourceBrandId: item.brand_id,
      sourceCampaignId: item.campaign_id || null,
      isArchived: item.is_archived || false,
    };

    // Set the drag data using a custom MIME type
    e.dataTransfer.setData("application/gallery-drag", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";

    // Optional: Set drag image to show count if multiple items
    if (itemsToDrag.length > 1) {
      const dragImage = document.createElement("div");
      dragImage.className =
        "bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg font-medium";
      dragImage.textContent = `Moving ${itemsToDrag.length} items`;
      dragImage.style.position = "absolute";
      dragImage.style.top = "-1000px";
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

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

  const { thumbnailShape } = useGalleryFilterStore();

  // console.log("Thumbnail Shape:", thumbnailShape);

  const aspectRatio =
    thumbnailShape === "dynamic"
      ? dimensions.width / dimensions.height || 1
      : 1;
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
      onClick={handleImageClick}
      // Don't attach dnd-kit attributes here - only on drag handle
      draggable={enableDragToMove && !isMediaSelectDialog} // HTML5 drag for moving to campaigns
      onDragStart={enableDragToMove ? handleDragStart : undefined}
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

        {/* Drag handle for reordering - only works when orderBy is manual */}
        {isDraggable && !isMediaSelectDialog && isHovered && (
          <div
            {...listeners}
            {...attributes}
            className="w-16 h-1 bg-white rounded-full cursor-grab active:cursor-grabbing hover:w-20 transition-all top-2 -translate-x-1/2 left-1/2 absolute z-20 opacity-60 hover:opacity-100"
            draggable={false} // Prevent HTML5 drag on the handle
            onDragStart={(e) => e.preventDefault()} // Block HTML5 drag
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
