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
import { useQueryState } from "nuqs";
import { useGenerationsStore } from "@/store/generations.store";
import A2iBulkActions from "./A2iBulkActions";
import { useA2iStore } from "@/store/a2i.store";

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
  const { selectedBrandId, brands, getSelectedBrandCampaigns } =
    useBrandStore();
  const { isModelsFetched } = useModelsStore();
  const [items, setItems] = useState<A2iImageCardProps[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const { optimisitcallyDeletedGenerationIds } = useGenerationsStore();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const selectionMode = selectedItems.size > 0;
  const currentBrand = brands.find((b) => b.id === selectedBrandId);
  const brandName = currentBrand?.name ?? "download";
  const { selectedFolderId, selectedSubfolderId } = useA2iStore();

  const brandCampaigns = getSelectedBrandCampaigns();

  // Get all folder IDs to include (selected folder + all subfolders)
  const folderIdsToInclude = useMemo(() => {
    if (!selectedFolderId) return [];

    // If a specific subfolder is selected, only show that subfolder's content
    if (selectedSubfolderId) {
      return [selectedSubfolderId];
    }

    // If only campaign is selected (no subfolder), include campaign and all its subfolders
    const folderIds = new Set<string>([selectedFolderId]);

    const selectedFolder = brandCampaigns.find(
      (c) => c.id === selectedFolderId
    );

    if (selectedFolder?.sub_folders) {
      // Add all subfolder IDs
      selectedFolder.sub_folders.forEach((subFolder) => {
        folderIds.add(subFolder.id);
      });
    }

    return Array.from(folderIds);
  }, [selectedFolderId, selectedSubfolderId, brandCampaigns.length]);

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
    // Filter generations by selected folder and its subfolders
    const filteredGenerations =
      folderIdsToInclude.length > 0
        ? generations.filter((gen) => {
            // Check if generation belongs to selected campaign or subfolder
            const genCampaignId = gen.parameters?.campaign_id;
            const genSubfolderId = gen.parameters?.sub_folder_id;

            // If subfolder is selected, match only that subfolder
            if (selectedSubfolderId) {
              return genSubfolderId === selectedSubfolderId;
            }

            // If campaign is selected, match campaign or any of its subfolders
            return (
              folderIdsToInclude.includes(genCampaignId) ||
              (genSubfolderId && folderIdsToInclude.includes(genSubfolderId))
            );
          })
        : generations;

    const flatImages = filteredGenerations.flatMap(
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
              invalidParameterError: generation.invalid_parameter_error || null,
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
          invalidParameterError: generation.invalid_parameter_error || null,
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
  }, [generations, folderIdsToInclude, selectedSubfolderId]);

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

  const inputContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTo, setScrollTo] = useQueryState("scrollTo");

  useEffect(() => {
    if (scrollTo === "a2i-input") {
      const observer = new MutationObserver(() => {
        setTimeout(() => {
          if (inputContainerRef.current) {
            inputContainerRef.current.scrollIntoView({
              behavior: "smooth",
              block: "end",
            });
            setScrollTo(null);
            observer.disconnect();
          }
        }, 50);
      });

      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, [scrollTo]);
  const handleSelect = useCallback(
    (item: A2iImageCardProps, selected: boolean) => {
      // For failed generation use generationId
      const itemId =
        item.status === "failed"
          ? item.generationId
          : item.video?.id ?? item.image?.id;

      if (!itemId) return;

      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(itemId);
        } else {
          newSet.delete(itemId);
        }
        return newSet;
      });
    },
    []
  );

  const handleSelectAll = useCallback(() => {
    const allIds = displayedItems
      .filter((item) => item.status === "completed" || item.status === "failed")
      .map((item) => {
        // Use generationId for failed
        return item.status === "failed"
          ? item.generationId
          : item.video?.id ?? item.image?.id;
      })
      .filter((id): id is string => id !== undefined && id !== null);
    setSelectedItems(new Set(allIds));
  }, [displayedItems]);

  const handleUnselectAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Clear selection on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedItems.size > 0) {
        setSelectedItems(new Set());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItems.size]);

  // Get selected items data
  const selectedItemsData = useMemo(() => {
    return displayedItems.filter((item) => {
      const itemId =
        item.status === "failed"
          ? item.generationId
          : item.video?.id ?? item.image?.id;
      return itemId && selectedItems.has(itemId);
    });
  }, [displayedItems, selectedItems]);

  return (
    <ContentSection
      title=""
      showCopy={false}
      showPin={false}
      context={contextValue}
      ref={formRef}
      content={
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0">
            {/* Form Section */}
            <div
              ref={inputContainerRef}
              className={selectionMode ? "" : "mb-4"}
            >
              {!isModelsFetched ? (
                <A2iImageInputLoader />
              ) : (
                <A2iImageInput
                  referenceMoodboardId={referenceMoodboardId}
                  currentCampaign={currentCampaign}
                  selectionMode={selectionMode}
                />
              )}
            </div>
            {/* Bulk Action Bar - Appears when items selected */}
            {selectionMode && (
              <A2iBulkActions
                selectedItems={selectedItemsData}
                onUnselectAll={handleUnselectAll}
                onSelectAll={handleSelectAll}
                onDeleteSuccess={() => {
                  // Refresh the generations list or remove deleted items
                  setSelectedItems(new Set());
                }}
                brandName={brandName}
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
                  {displayedItems
                    .filter(
                      (i) =>
                        !optimisitcallyDeletedGenerationIds.includes(
                          i.generationId
                        )
                    )
                    .map((image) => {
                      const existingId = getExistingId(image);
                      const trackingId = getItemTrackingId(image);
                      const itemId =
                        image.status === "failed"
                          ? image.generationId
                          : image.video?.id ?? image.image?.id;
                      const isSelected = itemId
                        ? selectedItems.has(itemId)
                        : false;

                      if (image.status === "completed" && existingId) {
                        return (
                          <A2iImageCardDraggable
                            key={trackingId}
                            imageData={image}
                            isSelected={isSelected}
                            onSelect={(selected) =>
                              handleSelect(image, selected)
                            }
                            selectionMode={selectionMode}
                          />
                        );
                      }

                      // For non-completed items or items without existing IDs, use regular card
                      return (
                        <A2iImageCard
                          key={trackingId}
                          {...image}
                          disableDrag={!existingId}
                          isSelected={isSelected}
                          onSelect={(selected) => handleSelect(image, selected)}
                          selectionMode={selectionMode}
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
