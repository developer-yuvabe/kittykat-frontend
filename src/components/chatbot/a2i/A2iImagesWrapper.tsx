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
import { UseFormReturn } from "react-hook-form";

type A2iImagesWrapperProps = {
  generations: A2iImageGeneration[];
  form: UseFormReturn<any>;
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

export const A2iImagesWrapper = ({
  generations,
  form,
}: A2iImagesWrapperProps) => {
  const { selectedBrandId } = useBrandStore();
  const [items, setItems] = useState<A2iImageCardProps[]>([]);

  // Track drag and server update states
  const isUpdatingServer = useRef(false);
  const isDragging = useRef(false);
  const dragEndTime = useRef(0);

  useEffect(() => {
    const flatImages = generations.flatMap(
      (generation): A2iImageCardProps[] => {
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
      }
    );

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

    setItems(flatImages);
  }, [generations]);

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
                      />
                    );
                  }

                  // For non-completed items or items without existing IDs, use regular card
                  return (
                    <A2iImageCard
                      key={trackingId}
                      {...image}
                      disableDrag={!existingId}
                    />
                  );
                })}

                {Array.from({
                  length: INTIAL_IMAGE_PLACEHOLDER,
                }).map((_, index) => (
                  <A2iImagePlaceholderCard
                    key={`empty-placeholder-${items.length + index}`}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <A2iImageInput form={form} />
        </div>
      }
    />
  );
};
