"use client";

import type React from "react";
import { useState } from "react";
import Masonry from "react-masonry-css";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { GalleryItemResponse, GalleryItem } from "@/types/gallery.types";
import { MediaItemDetailsDialog } from "./MediaItemDetailsDialog";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { MediaItem } from "./MediaItem";

interface MediaGridProps {
  items: GalleryItemResponse[];
  selectedItems: string[];
  onSelect: (id: string, selected: boolean) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (item: GalleryItemResponse) => void;
  isMediaSelectDialog?: boolean;
  isMultiSelect?: boolean;
  inSelectionGalleryIds?: string[];
  handleUpdateTitle: (itemId: string, newTitle: string) => Promise<void>;
  handleUpdateComment: (
    itemId: string,
    commentId: string,
    text: string
  ) => Promise<void>;
  handleDeleteComment: (itemId: string, commentId: string) => Promise<void>;
  handleAddComment: (
    itemId: string,
    text: string,
    attachments?: string[]
  ) => Promise<void>;
  handleUpdatePartialData: UseMutateFunction<
    GalleryItemResponse,
    Error,
    {
      itemId: string;
      data: Partial<GalleryItem>;
    },
    unknown
  >;
  maxSelectionCount?: number;
}

export function MediaGrid({
  items,
  selectedItems,
  onSelect,
  onToggleFavorite,
  onDelete,
  onDownload,
  isMediaSelectDialog,
  handleUpdateTitle,
  handleUpdateComment,
  handleDeleteComment,
  handleAddComment,
  handleUpdatePartialData,
  isMultiSelect,
  inSelectionGalleryIds,
  maxSelectionCount,
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
      onDelete(itemToDelete);
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
        {items.map((item) => (
          <MediaItem
            key={item.id}
            item={item}
            isSelected={selectedItems.includes(item.id)}
            isHovered={hoveredItem === item.id}
            isMediaSelectDialog={isMediaSelectDialog}
            onSelect={onSelect}
            onToggleFavorite={onToggleFavorite}
            onDelete={handleDeleteClick}
            onDownload={onDownload}
            onDetailsClick={handleDetailsClick}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            handleUpdateTitle={handleUpdateTitle}
            handleUpdateComment={handleUpdateComment}
            handleDeleteComment={handleDeleteComment}
            handleAddComment={handleAddComment}
            isMultiSelect={isMultiSelect}
            inSelectionGalleryIds={inSelectionGalleryIds}
            maxSelectionCount={maxSelectionCount}
            selectedCount={selectedItems.length}
          />
        ))}
      </Masonry>

      {/* Details Dialog */}
      <MediaItemDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        item={selectedItemForDetails}
        handleUpdatePartialData={handleUpdatePartialData}
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
