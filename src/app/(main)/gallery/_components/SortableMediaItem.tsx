"use client";

import type React from "react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { GalleryItemResponse } from "@/types/gallery.types";
import { MediaOverlay } from "./MediaOverlay";
import { MediaImage } from "./MediaImage";
import { GalleryActions } from "@/hooks/useGallery";
import { ImageModal } from "@/components/shared/ImageModal";
import { handleDownloadImage } from "@/lib/utils";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Types
interface SortableMediaItemProps {
  item: GalleryItemResponse;
  isSelected: boolean;
  isHovered: boolean;
  isMediaSelectDialog?: boolean;
  onSelect: (id: string, selected: boolean, shiftKey?: boolean) => void;
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
  activeTab?: string;
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
  activeTab,
}: SortableMediaItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });
  const [showImageModal, setShowImageModal] = useState(false);

  const isAlreadySelected = (inSelectionGalleryIds ?? []).includes(item.id);

  // Check if max selection has been reached
  const hasReachedMax =
    typeof selectedCount === "number" &&
    typeof maxSelectionCount === "number" &&
    selectedCount >= maxSelectionCount;

  // Can't select new items if max reached, but can always deselect
  const canSelect = !hasReachedMax || isSelected || isAlreadySelected;

  // Determine if this item should be draggable (for any purpose - reorder or move)
  const canDrag = (enableDragToMove || isDraggable) && !isMediaSelectDialog;

  // Use @dnd-kit/sortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: !canDrag,
    data: {
      type: isSelected && selectedItems.length > 1 ? "MEDIA_ITEMS_MULTI" : "MEDIA_ITEM",
      itemIds: isSelected && selectedItems.length > 1 ? selectedItems : [item.id],
      sourceTab: activeTab,
      sourceCampaignId: item.campaign_id || null,
    },
  });

  // Style for drag transform
  // When isDraggable is false, don't apply the sortable transform (no reorder visual feedback)
  // This allows drag-to-move (campaigns/tabs) to work while preventing reorder UI effects
  const shouldApplySortableTransform = isDraggable;
  
  const style = {
    // Only apply transform when reordering is enabled, otherwise items won't shift during drag
    transform: shouldApplySortableTransform ? CSS.Transform.toString(transform) : undefined,
    transition: shouldApplySortableTransform ? transition : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  const handleImageLoad = (event: any) => {
    const target = event.target as HTMLImageElement;
    setDimensions({
      width: target.naturalWidth,
      height: target.naturalHeight,
    });
    setIsLoaded(true);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    const shiftKey = e.shiftKey;
    if (isMediaSelectDialog) {
      // Allow deselection for already selected items
      if (isAlreadySelected) {
        onSelect(item.id, false, shiftKey);
      }
      // Allow toggling if item is currently selected
      else if (isSelected) {
        onSelect(item.id, false, shiftKey);
      }
      // Only allow selection if we haven't reached max
      else if (canSelect) {
        onSelect(item.id, true, shiftKey);
      }
      // Show toast if max limit reached
      else if (hasReachedMax) {
        toast.warning(
          `Maximum selection limit reached (${maxSelectionCount} items)`,
          {
            description: "Please deselect an item before selecting a new one.",
          }
        );
      }
    } else if (!isMediaSelectDialog) {
      // If any items are selected, enable easy selection mode
      if (selectedCount && selectedCount > 0) {
        // Toggle selection for the clicked item
        onSelect(item.id, !isSelected, shiftKey);
      } else {
        // No items selected, show image modal
        setShowImageModal(true);
      }
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowImageModal(true);
  };

  const { thumbnailShape } = useGalleryFilterStore();

  const aspectRatio =
    thumbnailShape === "dynamic"
      ? dimensions.width / dimensions.height || 1
      : 1;
  const skeletonHeight = item.dimensions?.height
    ? Math.min(item.dimensions.height / 4, 400)
    : Math.floor(Math.random() * 200) + 200;

  // Enable easy selection mode when items are selected (even in regular gallery)
  const isEasySelectionMode = selectedCount && selectedCount > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        `mb-4 relative group overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ${
          isMediaSelectDialog || isEasySelectionMode ? "cursor-pointer" : ""
        }`,
        isDragging && "ring-2 ring-purple-500 shadow-lg"
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) =>
        isMediaSelectDialog || isEasySelectionMode
          ? handleImageClick(e)
          : undefined
      }
      {...(canDrag ? { ...attributes, ...listeners } : {})}
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
            onToggleFavorite={() => {
              galleryActions.patchItem({
                itemId: item.id,
                data: { is_favourite: !item.is_favourite },
              });
            }}
            isMediaSelectDialog={isMediaSelectDialog}
            isEasySelectionMode={!!isEasySelectionMode}
          />
        </div>

        <MediaOverlay
          item={item}
          isSelected={isSelected}
          isHovered={isHovered}
          isMediaSelectDialog={isMediaSelectDialog}
          onSelect={onSelect}
          isAlreadySelected={isAlreadySelected}
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
