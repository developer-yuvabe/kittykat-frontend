"use client";

import type React from "react";
import { useState } from "react";
import Masonry from "react-masonry-css";
import type { GalleryItemResponse } from "@/types/gallery.types";
import { MediaItemDetailsDialog } from "./MediaItemDetailsDialog";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { MediaItem } from "./MediaItem";
import { GalleryActions } from "@/hooks/useGallery";

interface MediaGridProps {
  selectedItems: string[];
  onSelect: (id: string, selected: boolean) => void;
  isMediaSelectDialog?: boolean;
  isMultiSelect?: boolean;
  inSelectionGalleryIds?: string[];
  maxSelectionCount?: number;
  galleryActions: GalleryActions;
}

export function MediaGrid({
  selectedItems,
  onSelect,
  isMediaSelectDialog,
  isMultiSelect,
  inSelectionGalleryIds,
  maxSelectionCount,
  galleryActions,
}: MediaGridProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] =
    useState<GalleryItemResponse | null>(null);

  const breakpointColumnsObj = {
    default: 5,
    1536: 4,
    1280: 4,
    1024: 3,
    768: 2,
    640: 2,
    500: 1,
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

  const handleDetailsClick = (item: GalleryItemResponse) => {
    setSelectedItemForDetails(item);
    setDetailsDialogOpen(true);
  };

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto -ml-4"
        columnClassName="pl-4 bg-clip-padding"
      >
        {galleryActions.galleryItems.map((item) => (
          <MediaItem
            key={item.id}
            item={item}
            isSelected={selectedItems.includes(item.id)}
            isHovered={hoveredItem === item.id}
            isMediaSelectDialog={isMediaSelectDialog}
            onSelect={onSelect}
            onDelete={handleDeleteClick}
            onDownload={galleryActions.downloadItem}
            onDetailsClick={handleDetailsClick}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            isMultiSelect={isMultiSelect}
            inSelectionGalleryIds={inSelectionGalleryIds}
            maxSelectionCount={maxSelectionCount}
            selectedCount={selectedItems.length}
            galleryActions={galleryActions}
          />
        ))}
      </Masonry>

      {/* Details Dialog */}
      <MediaItemDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        item={selectedItemForDetails}
        handleUpdatePartialData={galleryActions.patchItem}
      />

      {/* Delete confirmation dialog */}
      <ReusableAlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        danger={true}
      />
    </>
  );
}
