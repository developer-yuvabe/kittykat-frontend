"use client";

import { ContentSection } from "@/components/shared/ContentSection";
import type {
  A2iImageGeneration,
  ThreadA2iImage,
  ThreadCampaign,
} from "@/types/types";
import {
  A2iImageCard,
  type A2iImageCardProps,
  A2iImagePlaceholderCard,
} from "./A2iImageCard";
import A2iImageInput from "./A2iImageInput";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
  RefObject,
} from "react";
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
import { useModelsStore } from "@/store/models.store";
import { parseMongoDBDate } from "@/lib/a2i.utils";
import A2iImageInputLoader from "./A2iImageInputLoader";

type A2iImagesWrapperProps = {
  generations: A2iImageGeneration[];
  formRef: RefObject<HTMLDivElement | null>;
  referenceMoodboardId: ThreadA2iImage["reference_moodboard_id"];
  currentCampaign: ThreadCampaign | null;
};

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
  formRef,
  referenceMoodboardId,
  currentCampaign,
}: A2iImagesWrapperProps) => {
  const { selectedBrandId } = useBrandStore();
  const { selectedImageGenerationModel, isModelsFetched } = useModelsStore();
  const [items, setItems] = useState<A2iImageCardProps[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Track component resize to adjust items per page
  useResizeObserver({
    ref: gridContainerRef as React.RefObject<HTMLDivElement>,
    onResize: (size) => {
      // Increase items to 25 if container width increases
      if (size.width && size.width > 800) {
        setItemsPerPage(28);
      } else {
        setItemsPerPage(20);
      }
    },
  });

  // Infinite scroll hook for pagination
  const { displayedItems, sentinelRef, hasMore, isLoading, reset } =
    useInfiniteScroll({
      items,
      itemsPerPage,
      loadingDelay: 1500,
    });

  // Reset pagination when items change significantly
  useEffect(() => {
    reset();
  }, [items.length, reset]);

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
              upscaleParameters: generation.upscale_parameters,
              video: generation.video,
              isNSFW: generation.is_nsfw_detected || false,
              createdAt: generation.created_at,
              updatedAt: generation.updated_at,
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
          upscaleParameters: generation.upscale_parameters,
          video: generation.video,
          isNSFW: generation.is_nsfw_detected || false,
          createdAt: generation.created_at,
          updatedAt: generation.updated_at,
        }));
      }
    );

    flatImages.sort((a, b) => {
      const aPos = a.image?.position ?? Number.POSITIVE_INFINITY;
      const bPos = b.image?.position ?? Number.POSITIVE_INFINITY;
      // 1️⃣ Smaller position first (top)
      if (aPos !== bPos) return aPos - bPos;

      const aDate = parseMongoDBDate(a.createdAt);
      const bDate = parseMongoDBDate(b.createdAt);
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

  const contextValue = useMemo(() => ({ data: {} }), []);

  return (
    <ContentSection
      title=""
      showCopy={false}
      showPin={false}
      context={contextValue}
      ref={formRef}
      content={
        <div className="flex flex-col gap-4 h-full">
          {/* Form Section - Above */}
          <div className="flex-shrink-0">
            {!isModelsFetched || !selectedImageGenerationModel ? (
              <A2iImageInputLoader />
            ) : (
              <A2iImageInput
                referenceMoodboardId={referenceMoodboardId}
                currentCampaign={currentCampaign}
              />
            )}
          </div>

          {/* Images Grid Section - Below */}
          <div className="flex-1 bg-muted rounded-md max-h-[520px] overflow-y-scroll">
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
                <div
                  ref={gridContainerRef}
                  className="grid grid-cols-[repeat(auto-fill,_minmax(240px,_1fr))] h-full overflow-y-auto scrollbar gap-[1px] content-start justify-center p-1"
                >
                  {displayedItems.map((image) => {
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

                  {/* Show placeholder cards if items are less than itemsPerPage and no more pages */}
                  {!hasMore && displayedItems.length < itemsPerPage && (
                    <>
                      {Array.from({
                        length: itemsPerPage - displayedItems.length,
                      }).map((_, index) => (
                        <A2iImagePlaceholderCard
                          key={`placeholder-${displayedItems.length + index}`}
                        />
                      ))}
                    </>
                  )}

                  {/* Loading indicator for pagination */}
                  {isLoading && (
                    <>
                      {Array.from({
                        length: 20,
                      }).map((_, index) => (
                        <A2iImagePlaceholderCard
                          key={`placeholder-${displayedItems.length + index}`}
                          loading
                        />
                      ))}
                    </>
                  )}

                  {/* Sentinel element for infinite scroll trigger */}
                  {hasMore && (
                    <div
                      ref={sentinelRef}
                      className="col-span-full h-4"
                      aria-label="Load more items"
                    />
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      }
    />
  );
};
