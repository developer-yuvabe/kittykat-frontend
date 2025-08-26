"use client";

import type React from "react";
import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import Masonry from "react-masonry-css";
import type { GalleryItemResponse } from "@/types/gallery.types";
import { MediaItemDetailsDialog } from "./MediaItemDetailsDialog";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { SortableMediaItem } from "./SortableMediaItem";
import { MediaEditorDialog } from "./MediaEditorDialog";
import { GalleryActions } from "@/hooks/useGallery";

interface SortableMediaGridProps {
  selectedItems: string[];
  onSelect: (id: string, selected: boolean) => void;
  isMediaSelectDialog?: boolean;
  isMultiSelect?: boolean;
  inSelectionGalleryIds?: string[];
  maxSelectionCount?: number;
  galleryActions: GalleryActions;
}

export function SortableMediaGrid({
  selectedItems,
  onSelect,
  isMediaSelectDialog = false,
  isMultiSelect,
  inSelectionGalleryIds,
  maxSelectionCount,
  galleryActions,
}: SortableMediaGridProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] =
    useState<GalleryItemResponse | null>(null);

  // New state for MediaEditor carousel
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentEditorIndex, setCurrentEditorIndex] = useState(0);

  // Get the gallery items and sort them by brand_sort_order
  const galleryItems = useMemo(() => {
    const items = galleryActions.getGalleryItems();
    return items.sort(
      (a, b) => (a.brand_sort_order || 0) - (b.brand_sort_order || 0)
    );
  }, [galleryActions]);

  const breakpointColumnsObj = {
    default: 5,
    1536: 4,
    1280: 4,
    1024: 3,
    768: 2,
    640: 2,
    500: 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    const itemIndex = galleryItems.findIndex(
      (galleryItem) => galleryItem.id === item.id
    );
    if (itemIndex !== -1) {
      setCurrentEditorIndex(itemIndex);
      setEditorOpen(true);
    }
  };

  // Handle carousel navigation
  const handleEditorNavigate = (direction: "next" | "prev") => {
    const totalItems = galleryItems.length;

    if (direction === "next" && currentEditorIndex < totalItems - 1) {
      setCurrentEditorIndex(currentEditorIndex + 1);
    } else if (direction === "prev" && currentEditorIndex > 0) {
      setCurrentEditorIndex(currentEditorIndex - 1);
    }
  };

  const currentEditorItem = galleryItems[currentEditorIndex] || null;

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
              onDetailsClick={handleDetailsClick}
              onEditClick={handleEditClick}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              isMultiSelect={isMultiSelect}
              inSelectionGalleryIds={inSelectionGalleryIds}
              maxSelectionCount={maxSelectionCount}
              selectedCount={selectedItems.length}
              galleryActions={galleryActions}
              isDraggable={false} // Disable dragging in dialog mode
            />
          ))}
        </Masonry>

        {/* Dialogs */}
        <MediaItemDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          item={selectedItemForDetails}
          handleUpdatePartialData={galleryActions.patchItem}
        />

        <MediaEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          item={currentEditorItem}
          galleryActions={galleryActions}
          currentIndex={currentEditorIndex}
          onNavigate={handleEditorNavigate}
          totalItems={galleryItems.length}
        />

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

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = galleryItems.findIndex(
          (item) => item.id === active.id
        );
        const newIndex = galleryItems.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          // Create new order array
          const reorderedItems = arrayMove(galleryItems, oldIndex, newIndex);

          // Create reorder data with new sort orders
          const reorderData = reorderedItems.map((item, index) => ({
            id: item.id,
            brand_sort_order: index,
          }));

          // Call the reorder mutation
          galleryActions.reorderItems(reorderData);
        }
      }
    },
    [galleryItems, galleryActions]
  );

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={galleryItems.map((item) => item.id)}
          strategy={rectSortingStrategy}
        >
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
                onDetailsClick={handleDetailsClick}
                onEditClick={handleEditClick}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                isMultiSelect={isMultiSelect}
                inSelectionGalleryIds={inSelectionGalleryIds}
                maxSelectionCount={maxSelectionCount}
                selectedCount={selectedItems.length}
                galleryActions={galleryActions}
                isDraggable={true} // Enable dragging in normal mode
              />
            ))}
          </Masonry>
        </SortableContext>
      </DndContext>

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
        totalItems={galleryItems.length}
      />

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
