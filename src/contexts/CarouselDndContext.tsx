"use client";

import React, { createContext, useContext, useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  CollisionDetection,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { GalleryItemResponse } from "@/types/gallery.types";
import { CustomGalleryDragOverlay } from "@/components/gallery/CustomGalleryDragOverlay";

interface CarouselDragData {
  type: "carousel";
  item: GalleryItemResponse;
}

interface PlaceholderDropData {
  type: "placeholder";
  placeholderIndex: number;
}

interface CarouselDndContextValue {
  isDragging: boolean;
  draggedItem: GalleryItemResponse | null;
  onGalleryItemDrop?: (
    item: GalleryItemResponse,
    placeholderIndex: number
  ) => void;
  // Add sortable functionality
  onSortableMove?: (oldIndex: number, newIndex: number) => void;
  activeSortableId?: string;
  // Add flag to distinguish between drag types
  isDraggingCarouselItem: boolean;
  isDraggingSortableItem: boolean;
}

const CarouselDndContext = createContext<CarouselDndContextValue | null>(null);

export const useCarouselDnd = () => {
  const context = useContext(CarouselDndContext);
  // Return null if context is not available instead of throwing
  return context;
};

interface CarouselDndProviderProps {
  children: React.ReactNode;
  onGalleryItemDrop?: (
    item: GalleryItemResponse,
    placeholderIndex: number
  ) => void;
  // Add sortable functionality props
  onSortableMove?: (oldIndex: number, newIndex: number) => void;
  sortableItems?: any[];
}

// Custom collision detection that prioritizes placeholders but allows sortable
const customCollisionDetection: CollisionDetection = (args) => {
  const { active } = args;
  const dragData = active.data.current;

  // For carousel items being dragged, prioritize placeholders
  if (dragData?.type === "carousel") {
    // First try pointer intersection for precise targeting
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      // Prioritize placeholder droppables for carousel items
      const placeholderCollisions = pointerCollisions.filter((collision) => {
        const droppable = args.droppableContainers.find(
          (container) => container.id === collision.id
        );
        return droppable?.data.current?.type === "placeholder";
      });

      if (placeholderCollisions.length > 0) {
        return placeholderCollisions;
      }

      return pointerCollisions;
    }

    // Fallback to rectangle intersection for carousel items
    const rectCollisions = rectIntersection(args);

    // Still prioritize placeholders in rect intersection
    const placeholderRectCollisions = rectCollisions.filter((collision) => {
      const droppable = args.droppableContainers.find(
        (container) => container.id === collision.id
      );
      return droppable?.data.current?.type === "placeholder";
    });

    return placeholderRectCollisions.length > 0
      ? placeholderRectCollisions
      : rectCollisions;
  }

  // For sortable items (no type property), also prioritize placeholders when available
  if (!dragData?.type) {
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      // Check if any collision is with a placeholder
      const placeholderCollisions = pointerCollisions.filter((collision) => {
        const droppable = args.droppableContainers.find(
          (container) => container.id === collision.id
        );
        return droppable?.data.current?.type === "placeholder";
      });

      // If we have placeholder collisions, prioritize them
      if (placeholderCollisions.length > 0) {
        return placeholderCollisions;
      }

      return pointerCollisions;
    }

    // Fallback to rectangle intersection for sortable items
    const rectCollisions = rectIntersection(args);

    // Check for placeholder collisions in rectangle intersection too
    const placeholderRectCollisions = rectCollisions.filter((collision) => {
      const droppable = args.droppableContainers.find(
        (container) => container.id === collision.id
      );
      return droppable?.data.current?.type === "placeholder";
    });

    return placeholderRectCollisions.length > 0
      ? placeholderRectCollisions
      : rectCollisions;
  }

  // Default collision detection for other cases
  return pointerWithin(args).length > 0
    ? pointerWithin(args)
    : rectIntersection(args);
};

export const CarouselDndProvider: React.FC<CarouselDndProviderProps> = ({
  children,
  onGalleryItemDrop,
  onSortableMove,
  sortableItems = [],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<GalleryItemResponse | null>(
    null
  );
  const [activeSortableId, setActiveSortableId] = useState<
    string | undefined
  >();
  const [activePhoto, setActivePhoto] = useState<any>(undefined);

  // Add sensors for better drag handling
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Require minimum 3px movement to start drag
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const dragData = active.data.current;

    if (dragData?.type === "carousel") {
      setIsDragging(true);
      setDraggedItem(dragData.item);
      setActiveSortableId(undefined);
      // Set activePhoto for carousel item
      setActivePhoto({
        photo: {
          id: `carousel-${dragData.item.id}`,
          src: dragData.item.preview_url || dragData.item.asset_url,
          width: 300,
          height: 300,
          alt: dragData.item.asset_title || "Carousel image",
          liked: dragData.item.is_favourite || false,
          is_placeholder: false,
        },
        width: 300,
        height: 300,
        is_placeholder: false,
      });
    } else {
      // Handle sortable drag (moodboard items)
      const sortableItem = sortableItems.find((item) => item.id === active.id);
      setIsDragging(true);
      setDraggedItem(null);
      setActiveSortableId(active.id as string);
      // Set activePhoto for sortable item
      if (sortableItem) {
        setActivePhoto({
          photo: sortableItem,
          width: sortableItem.width,
          height: sortableItem.height,
          is_placeholder: sortableItem.is_placeholder,
        });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setIsDragging(false);
    setDraggedItem(null);
    setActiveSortableId(undefined);
    setActivePhoto(undefined);

    if (!over) {
      console.log("❌ Drop cancelled - no valid drop target");
      return;
    }

    const dragData = active.data.current;
    const dropData = over.data.current;

    console.log("📊 Drag data:", dragData);
    console.log("📍 Drop data:", dropData);

    // Handle carousel to placeholder drop
    if (dragData?.type === "carousel" && dropData?.type === "placeholder") {
      console.log(
        "✅ Valid carousel drop - calling onGalleryItemDrop",
        dragData.item.asset_title,
        "to position",
        dropData.placeholderIndex
      );
      onGalleryItemDrop?.(dragData.item, dropData.placeholderIndex);
    }
    // Handle sortable item to placeholder as sorting/reordering (not a drop)
    else if (!dragData?.type && dropData?.type === "placeholder") {
      const oldIndex = sortableItems.findIndex((item) => item.id === active.id);
      const newIndex = dropData.placeholderIndex;

      console.log("🔄 Sortable to placeholder reordering:", {
        oldIndex,
        newIndex: dropData.placeholderIndex,
        activeId: active.id,
        overId: over.id,
      });

      if (oldIndex !== -1 && onSortableMove) {
        console.log("✅ Valid sortable to placeholder move:", {
          oldIndex,
          newIndex,
        });
        onSortableMove(oldIndex, newIndex);
      } else {
        console.log(
          "❌ Could not find sortable item index or onSortableMove not available"
        );
      }
    }
    // Handle sortable reordering (when both active and over are sortable items, and no specific types)
    else if (active.id !== over.id && !dragData?.type && !dropData?.type) {
      const oldIndex = sortableItems.findIndex((item) => item.id === active.id);
      const newIndex = sortableItems.findIndex((item) => item.id === over.id);

      console.log("🔄 Sortable indices:", {
        oldIndex,
        newIndex,
        activeId: active.id,
        overId: over.id,
      });

      if (oldIndex !== -1 && newIndex !== -1) {
        console.log("✅ Valid sortable move:", { oldIndex, newIndex });
        onSortableMove?.(oldIndex, newIndex);
      } else {
        console.log("❌ Could not find indices for sortable items");
      }
    } else {
      console.log("❌ Invalid drop - mismatched types or same position", {
        dragType: dragData?.type,
        dropType: dropData?.type,
        activeId: active.id,
        overId: over.id,
        isSameId: active.id === over.id,
      });
    }
  };

  const contextValue: CarouselDndContextValue = {
    isDragging,
    draggedItem,
    onGalleryItemDrop,
    onSortableMove,
    activeSortableId,
    isDraggingCarouselItem: isDragging && !!draggedItem,
    isDraggingSortableItem: isDragging && !!activeSortableId,
  };

  return (
    <CarouselDndContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={customCollisionDetection}
      >
        <SortableContext items={sortableItems.map((item) => item.id)}>
          {children}
        </SortableContext>
        <CustomGalleryDragOverlay activePhoto={activePhoto} />
      </DndContext>
    </CarouselDndContext.Provider>
  );
};

// Hook for making carousel items draggable
export const useCarouselItemDraggable = (item: GalleryItemResponse) => {
  const carouselContext = useCarouselDnd();

  // If no carousel context available, return default values
  if (!carouselContext) {
    console.warn(
      "⚠️ useCarouselItemDraggable: No carousel context available for item:",
      item.asset_title
    );
    return {
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      isDragging: false,
    };
  }

  return useDraggable({
    id: `carousel-${item.id}`,
    data: {
      type: "carousel",
      item,
    } as CarouselDragData,
  });
};

// Hook for making placeholders droppable
export const usePlaceholderDroppable = (placeholderIndex: number) => {
  const carouselContext = useCarouselDnd();

  // If no carousel context available, return default values
  if (!carouselContext) {
    console.warn(
      "⚠️ usePlaceholderDroppable: No carousel context available for placeholder:",
      placeholderIndex
    );
    return {
      setNodeRef: () => {},
      isDraggedOver: false,
      isDragging: false,
    };
  }

  const { isDraggingCarouselItem, isDraggingSortableItem } = carouselContext;

  const { setNodeRef, isOver, active } = useDroppable({
    id: `placeholder-${placeholderIndex}`,
    data: {
      type: "placeholder",
      placeholderIndex,
    } as PlaceholderDropData,
  });

  // Only show drop zone indicator for carousel items (external items being dropped)
  // For sortable items (internal reordering), don't show the drop indicator
  const isDraggedOver =
    isOver &&
    active?.data.current?.type === "carousel" &&
    isDraggingCarouselItem;

  return {
    setNodeRef,
    isDraggedOver,
    isDragging: isDraggingCarouselItem || isDraggingSortableItem, // Consider both types for collision detection
  };
};

// Hook for making items sortable within the unified context
export const useUnifiedSortable = (id: string) => {
  return useSortable({ id });
};
