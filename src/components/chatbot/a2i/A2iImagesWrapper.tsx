"use client";

import { ContentSection } from "@/components/shared/ContentSection";
import type { A2iImageGeneration } from "@/types/types";
import {
  A2iImageCard,
  type A2iImageCardProps,
  A2iImagePlaceholderCard,
} from "./A2iImageCard";
import A2iImageInput from "./A2iImageInput";
import A2iImageModelSelector from "./A2iImageModelSelector";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { updateA2iImagePositions } from "@/services/api/a2i.service";
import { useBrandStore } from "@/store/brand.store";
import A2iImageCardDraggable from "./A2iImageCardDraggable";
import { toast } from "sonner";

type A2iImagesWrapperProps = {
  generations: A2iImageGeneration[];
};

const INTIAL_IMAGE_PLACEHOLDER = 16;

// Helper function to get existing ID only - no fallback generation
const getExistingId = (item: A2iImageCardProps): string | null => {
  return item.image?.id || item.video?.id || null;
};

// Helper function to get unique identifier for tracking (including processing items)
const getItemTrackingId = (item: A2iImageCardProps): string => {
  return getExistingId(item) || `generation-${item.generationId}`;
};

// Helper function to convert generations to items
const generationsToItems = (
  generations: A2iImageGeneration[]
): A2iImageCardProps[] => {
  const flatImages = generations.flatMap((generation): A2iImageCardProps[] => {
    const images = generation.images;

    if (!images || images.length === 0) {
      return [
        {
          image: null,
          status: generation.status,
          generationId: generation.id,
          parameters: generation.parameters,
          type: generation.type,
          vtonParameters: generation.vton_parameters,
          remixParameters: generation.remix_parameters,
          video: generation.video,
        },
      ];
    }

    return images.map((img) => ({
      image: img,
      status: generation.status,
      generationId: generation.id,
      parameters: generation.parameters,
      type: generation.type,
      vtonParameters: generation.vton_parameters,
      remixParameters: generation.remix_parameters,
      video: generation.video,
    }));
  });

  // Sort by position first, then by creation date (newest first for same position)
  flatImages.sort((a, b) => {
    const aPos = a.image?.position ?? Number.POSITIVE_INFINITY;
    const bPos = b.image?.position ?? Number.POSITIVE_INFINITY;

    if (aPos !== bPos) {
      return aPos - bPos;
    }

    const aDate = new Date(a.image?.created_at ?? "").getTime();
    const bDate = new Date(b.image?.created_at ?? "").getTime();
    return bDate - aDate;
  });

  return flatImages;
};

// Create a set of existing item tracking IDs for comparison
const getItemTrackingIds = (items: A2iImageCardProps[]): Set<string> => {
  return new Set(items.map(getItemTrackingId));
};

export const A2iImagesWrapper = ({ generations }: A2iImagesWrapperProps) => {
  const { selectedBrandId } = useBrandStore();
  const [items, setItems] = useState<A2iImageCardProps[]>([]);

  // Track drag and server update states
  const isUpdatingServer = useRef(false);
  const isDragging = useRef(false);
  const dragEndTime = useRef(0);

  // Track the last known generations to detect changes
  const lastGenerationsRef = useRef<A2iImageGeneration[]>([]);

  const updateItems = useCallback((newGenerations: A2iImageGeneration[]) => {
    const newItems = generationsToItems(newGenerations);
    setItems(newItems);
    lastGenerationsRef.current = newGenerations;
  }, []);

  // Handle item deletion - remove from local state immediately
  const handleItemDeleted = useCallback((deletedId: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => {
        const itemId = getExistingId(item);
        return itemId !== deletedId;
      })
    );
  }, []);

  useEffect(() => {
    const now = Date.now();

    // Don't update during drag operations
    if (isDragging.current) {
      return;
    }

    // Don't update immediately after drag ends (prevent flicker)
    if (now - dragEndTime.current < 1000) {
      return;
    }

    // Don't update during server operations
    if (isUpdatingServer.current) {
      return;
    }

    // Check if this is a meaningful update
    const currentItems = generationsToItems(generations);
    const currentTrackingIds = getItemTrackingIds(currentItems);
    const existingTrackingIds = getItemTrackingIds(items);

    // Check for new items (including processing items)
    const hasNewItems = currentItems.some((item) => {
      const trackingId = getItemTrackingId(item);
      return !existingTrackingIds.has(trackingId);
    });

    // Check for status changes (processing -> completed)
    const hasStatusChanges = currentItems.some((currentItem) => {
      const existingItem = items.find((item) => {
        const currentTrackingId = getItemTrackingId(currentItem);
        const existingTrackingId = getItemTrackingId(item);
        return currentTrackingId === existingTrackingId;
      });
      return existingItem && existingItem.status !== currentItem.status;
    });

    // Check for deleted items (items that exist locally but not in new data)
    const hasDeletedItems = items.some((item) => {
      const trackingId = getItemTrackingId(item);
      return !currentTrackingIds.has(trackingId);
    });

    // Check for content updates (when images/videos become available)
    const hasContentUpdates = currentItems.some((currentItem) => {
      const existingItem = items.find((item) => {
        const currentTrackingId = getItemTrackingId(currentItem);
        const existingTrackingId = getItemTrackingId(item);
        return currentTrackingId === existingTrackingId;
      });

      if (!existingItem) return false;

      // Check if image/video content became available
      const hadContent = !!(existingItem.image?.url || existingItem.video?.url);
      const hasContent = !!(currentItem.image?.url || currentItem.video?.url);

      return !hadContent && hasContent;
    });

    console.log("SSE Update Check:", {
      generationsLength: generations.length,
      currentItemsLength: currentItems.length,
      existingItemsLength: items.length,
      hasNewItems,
      hasStatusChanges,
      hasDeletedItems,
      hasContentUpdates,
      isDragging: isDragging.current,
      isUpdatingServer: isUpdatingServer.current,
      timeSinceDrag: now - dragEndTime.current,
    });

    // Update if there are new items, status changes, deletions, content updates, or first load
    if (
      hasNewItems ||
      hasStatusChanges ||
      hasDeletedItems ||
      hasContentUpdates ||
      items.length === 0
    ) {
      console.log("Updating items:", {
        hasNewItems,
        hasStatusChanges,
        hasDeletedItems,
        hasContentUpdates,
        itemsLength: items.length,
      });

      // If we have existing items and there are new ones, append to end
      if (items.length > 0 && hasNewItems && !hasDeletedItems) {
        const mergedItems = [...items];

        // Add new items to the END (most recent last)
        currentItems.forEach((newItem) => {
          const trackingId = getItemTrackingId(newItem);
          if (!existingTrackingIds.has(trackingId)) {
            mergedItems.push(newItem);
          }
        });

        // Update status and content of existing items
        for (let i = 0; i < mergedItems.length; i++) {
          const existingItem = mergedItems[i];
          const updatedItem = currentItems.find((item) => {
            const existingTrackingId = getItemTrackingId(existingItem);
            const currentTrackingId = getItemTrackingId(item);
            return existingTrackingId === currentTrackingId;
          });

          if (
            updatedItem &&
            (updatedItem.status !== existingItem.status ||
              updatedItem.image?.url !== existingItem.image?.url ||
              updatedItem.video?.url !== existingItem.video?.url)
          ) {
            mergedItems[i] = updatedItem;
          }
        }

        setItems(mergedItems);
      } else {
        // First load, full refresh due to deletions, or no existing items
        updateItems(generations);
      }
    }

    lastGenerationsRef.current = generations;
  }, [generations, items, updateItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      isDragging.current = false;
      dragEndTime.current = Date.now();

      if (!over || active.id === over.id || isUpdatingServer.current) {
        return;
      }

      const activeIndex = items.findIndex((item) => {
        const id = getExistingId(item);
        return id === active.id;
      });

      const overIndex = items.findIndex((item) => {
        const id = getExistingId(item);
        return id === over.id;
      });

      if (activeIndex === -1 || overIndex === -1) {
        console.warn("Invalid drag indices detected:", {
          activeId: active.id,
          overId: over.id,
          activeIndex,
          overIndex,
        });
        return;
      }

      if (activeIndex === overIndex) {
        return;
      }

      const newItems = arrayMove(items, activeIndex, overIndex);
      setItems(newItems);

      const updates = newItems
        .map((item, index) => ({
          item,
          newPosition: index,
        }))
        .filter(({ item }) => item.image !== null)
        .map(({ item, newPosition }) => ({
          image_id: item.image!.id,
          generation_id: item.generationId,
          position: newPosition,
        }));

      if (updates.length === 0) {
        return;
      }

      isUpdatingServer.current = true;
      try {
        await updateA2iImagePositions(selectedBrandId!, updates);
        console.log("Successfully updated image positions");
      } catch (error) {
        console.error("Failed to update image positions:", error);
        // Revert to previous state on error
        setItems(items);
        toast.error("Failed to save new order. Please try again.", {
          position: "bottom-right",
        });
      } finally {
        isUpdatingServer.current = false;
      }
    },
    [items, selectedBrandId]
  );

  // Only include items that have existing IDs for sortable context
  const sortableItems = useMemo(() => {
    return items.map(getExistingId).filter(Boolean) as string[];
  }, [items]);

  const customActions = useMemo(() => <A2iImageModelSelector />, []);
  const contextValue = useMemo(() => ({ data: {} }), []);

  return (
    <ContentSection
      title=""
      customActions={customActions}
      showCopy={false}
      showPin={false}
      context={contextValue}
      content={
        <div className="relative h-[48rem] bg-muted rounded-md">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortableItems}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-[repeat(auto-fill,_minmax(240px,_1fr))] h-full relative overflow-y-auto scrollbar gap-[1px] content-start justify-center p-1">
                {items.map((image) => {
                  const existingId = getExistingId(image);
                  const trackingId = getItemTrackingId(image);

                  if (image.status === "completed" && existingId) {
                    return (
                      <A2iImageCardDraggable
                        key={trackingId}
                        imageData={image}
                        onItemDeleted={handleItemDeleted}
                      />
                    );
                  }

                  // For non-completed items or items without existing IDs, use regular card
                  return (
                    <A2iImageCard
                      key={trackingId}
                      {...image}
                      disableDrag={!existingId}
                      onItemDeleted={handleItemDeleted}
                    />
                  );
                })}

                {Array.from({
                  length: Math.max(0, INTIAL_IMAGE_PLACEHOLDER - items.length),
                }).map((_, index) => (
                  <A2iImagePlaceholderCard
                    key={`empty-placeholder-${items.length + index}`}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <A2iImageInput />
        </div>
      }
    />
  );
};
