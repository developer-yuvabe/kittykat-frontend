"use client";

import type React from "react";
import { useState } from "react";
import Masonry from "react-masonry-css";
import type { GalleryItemResponse } from "@/types/gallery.types";
import { MediaItemDetailsDialog } from "./MediaItemDetailsDialog";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { MediaItem } from "./MediaItem";
import { MediaEditorDialog } from "./MediaEditorDialog";
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

  // New state for MediaEditor carousel
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentEditorIndex, setCurrentEditorIndex] = useState(0);

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

  // New function to handle opening editor
  const handleEditClick = (item: GalleryItemResponse) => {
    const itemIndex = galleryActions.galleryItems.findIndex(
      (galleryItem) => galleryItem.id === item.id
    );
    if (itemIndex !== -1) {
      setCurrentEditorIndex(itemIndex);
      setEditorOpen(true);
    }
  };

  // Handle carousel navigation
  const handleEditorNavigate = (direction: "next" | "prev") => {
    const totalItems = galleryActions.galleryItems.length;

    if (direction === "next" && currentEditorIndex < totalItems - 1) {
      setCurrentEditorIndex(currentEditorIndex + 1);
    } else if (direction === "prev" && currentEditorIndex > 0) {
      setCurrentEditorIndex(currentEditorIndex - 1);
    }
  };

  const currentEditorItem =
    galleryActions.galleryItems[currentEditorIndex] || null;

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
            onEditClick={handleEditClick} // Pass the edit handler
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

      {/* Media Editor Dialog with Carousel */}
      <MediaEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        item={currentEditorItem}
        galleryActions={galleryActions}
        currentIndex={currentEditorIndex}
        onNavigate={handleEditorNavigate}
        totalItems={galleryActions.galleryItems.length}
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
