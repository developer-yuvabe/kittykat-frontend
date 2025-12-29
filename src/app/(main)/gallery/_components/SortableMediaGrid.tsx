"use client";

import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { GalleryActions } from "@/hooks/useGallery";
import { useBrandStore } from "@/store/brand.store";
import { useConceptVisualStore } from "@/store/concept-visual.store";
import type { GalleryItemResponse } from "@/types/gallery.types";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import Masonry from "react-masonry-css";
import { SortableMediaItem } from "./SortableMediaItem";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

interface SortableMediaGridProps {
  selectedItems: string[];
  onSelect: (id: string, selected: boolean, shiftKey?: boolean) => void;
  onClearSelection?: () => void;
  isMediaSelectDialog?: boolean;
  isMultiSelect?: boolean;
  inSelectionGalleryIds?: string[];
  maxSelectionCount?: number;
  galleryActions: GalleryActions;
  enableDragToMove?: boolean; // Enable drag-to-move functionality
  activeTab?: string;
}

export function SortableMediaGrid({
  selectedItems,
  onSelect,
  onClearSelection,
  isMediaSelectDialog = false,
  isMultiSelect,
  inSelectionGalleryIds,
  maxSelectionCount,
  galleryActions,
  enableDragToMove = false,
  activeTab,
}: SortableMediaGridProps) {
  const router = useRouter();
  const { setSelectedMoodboardId, setSelectedCampaignId } = useBrandStore();
  const { openConceptVisual } = useConceptVisualStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const { thumbnailSize, orderBy } = useGalleryFilterStore();

  // Get the gallery items and sort them by brand_sort_order
  const galleryItems = useMemo(() => {
    const items = galleryActions.getGalleryItems();
    return items;
  }, [galleryActions]);

  // Enable drag-to-reorder when orderBy is manual (brand_sort_order)
  const isDraggable = orderBy === "brand_sort_order";

  // Get item IDs for SortableContext
  const itemIds = useMemo(() => galleryItems.map((item) => item.id), [galleryItems]);

  const breakpointColumnsObj = {
    default:
      thumbnailSize === "small"
        ? 10
        : thumbnailSize === "medium"
        ? 6
        : thumbnailSize === "large"
        ? 4
        : 5,
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      galleryActions.deleteItem(itemToDelete);
      setItemToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  // New function to handle opening editor
  const handleEditClick = (item: GalleryItemResponse) => {
    openConceptVisual({
      source: "media-gallery",
      assetItems: galleryItems,
      asset: {
        galleryActions,
        currentAsset: item,
      },
    });
  };

  // Handle editing moodboard for moodboard assets
  const handleEditMoodboard = (item: GalleryItemResponse) => {
    // Set both campaign and moodboard to ensure proper context
    if (item.campaign_id) {
      setSelectedCampaignId(item.campaign_id);
    }
    setSelectedMoodboardId(item.moodboard_id || null);

    if (item.campaign_id && item.moodboard_id) {
      router.push(
        `/?campaignId=${item.campaign_id}&moodboardId=${item.moodboard_id}`
      );
    }
  };

  // Don't show DnD in dialog mode
  if (isMediaSelectDialog) {
    return (
      <>
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="flex w-auto -ml-4"
          columnClassName="pl-4 bg-clip-padding"
        >
          {galleryItems.map((item) => (
            <SortableMediaItem
              key={item.id}
              item={item}
              isSelected={selectedItems.includes(item.id)}
              isHovered={hoveredItem === item.id}
              isMediaSelectDialog={isMediaSelectDialog}
              onSelect={onSelect}
              onDelete={handleDeleteClick}
              onDownload={galleryActions.downloadItem}
              onEditClick={handleEditClick}
              onEditMoodboard={handleEditMoodboard}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              isMultiSelect={isMultiSelect}
              inSelectionGalleryIds={inSelectionGalleryIds}
              maxSelectionCount={maxSelectionCount}
              selectedCount={selectedItems.length}
              galleryActions={galleryActions}
              isDraggable={false} // Disable dragging in dialog mode
              selectedItems={selectedItems}
              enableDragToMove={false} // No drag-to-move in dialog
              activeTab={activeTab}
            />
          ))}
        </Masonry>

        <ReusableAlertDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Media Item"
          description="Are you sure you want to delete this media item? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
        />
      </>
    );
  }

  return (
    <>
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="flex w-auto -ml-4"
          columnClassName="pl-4 bg-clip-padding"
        >
          {galleryItems.map((item) => (
            <SortableMediaItem
              key={item.id}
              item={item}
              isSelected={selectedItems.includes(item.id)}
              isHovered={hoveredItem === item.id}
              isMediaSelectDialog={isMediaSelectDialog}
              onSelect={onSelect}
              onDelete={handleDeleteClick}
              onDownload={galleryActions.downloadItem}
              onEditClick={handleEditClick}
              onEditMoodboard={handleEditMoodboard}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              isMultiSelect={isMultiSelect}
              inSelectionGalleryIds={inSelectionGalleryIds}
              maxSelectionCount={maxSelectionCount}
              selectedCount={selectedItems.length}
              galleryActions={galleryActions}
              isDraggable={isDraggable}
              selectedItems={selectedItems}
              enableDragToMove={enableDragToMove}
              activeTab={activeTab}
            />
          ))}
        </Masonry>
      </SortableContext>

      {/* Delete confirmation dialog */}
      <ReusableAlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Media Item"
        description="Are you sure you want to delete this media item? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </>
  );
}
