import { ContentSection } from "@/components/shared/ContentSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateA2iShowboard } from "@/services/api/moodboard.service";
import { galleryService } from "@/services/api/gallery.service";
import { useBrandStore } from "@/store/brand.store";
import {
  MoodboardInformation,
  ThreadA2iImage,
  ThreadDetails,
} from "@/types/types";
import { UnifiedMoodboardItem } from "@/types/moodboard.types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { WandSparkles } from "lucide-react";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  RefObject,
  useRef,
} from "react";
import { toast } from "sonner";
import ManualMoodboardSkeleton from "../moodboards/MoodboardSkeleton";
import { EditIcon } from "@/components/ui/custom-icon";
import { useA2iStore } from "@/store/a2i.store";
import CustomGalleryContainer from "@/components/gallery/CustomGalleryContainer";
import { MIN_IMAGES_REQUIRED } from "@/lib/moodboard.utils";
import MoodboardSelector from "../moodboards/MoodboardSelector";
import { updateA2iRefernceMoodboard } from "@/services/api/a2i.service";
import { GalleryItemResponse } from "@/types/gallery.types";

type ReferenceMoodboardProps = {
  referenceMoodboardId: ThreadA2iImage["reference_moodboard_id"];
  prompts: ThreadA2iImage["prompts"];
  moodboardInformation: ThreadDetails["moodboard_information"];
  formRef: RefObject<HTMLDivElement | null>;
};

const ReferenceMoodboard = ({
  referenceMoodboardId,
  prompts,
  moodboardInformation,
  formRef,
}: ReferenceMoodboardProps) => {
  const { setReferencePrompt } = useA2iStore();
  const { setCampaignMoodboardSelection, setSelectedMoodboardId } =
    useBrandStore();
  const [n, setN] = useState<number | "">(prompts?.length || "");
  const [items, setItems] = useState<UnifiedMoodboardItem[]>([]);
  const [loading, setLoading] = useState(false);

  const { selectedBrandId } = useBrandStore();
  const { mutate: generateShowboard, isPending } = useMutation({
    mutationFn: () =>
      generateA2iShowboard(selectedBrandId!, referenceMoodboardId!, Number(n)),
  });

  const selectedMoodboard = useMemo(
    () => moodboardInformation?.find((mb) => mb.id === referenceMoodboardId),
    [moodboardInformation, referenceMoodboardId]
  );

  // Extract gallery item IDs from the effective moodboard assets
  const galleryItemIds = useMemo(() => {
    return (
      selectedMoodboard?.moodboard_assets?.map(
        (asset) => asset.gallery_item_id
      ) || []
    );
  }, [selectedMoodboard?.moodboard_assets]);

  // Get only non-placeholder IDs for API call (same as MoodboardLayout)
  const nonPlaceholderIds = useMemo(() => {
    return galleryItemIds.filter((id) => !String(id).startsWith("placeholder"));
  }, [galleryItemIds]);

  // Fetch only the required gallery items using bulk API
  const {
    data: bulkGalleryItems = [],
    isLoading: isBulkLoading,
    isFetching: isBulkFetching,
  } = useQuery({
    queryKey: ["gallery-items-bulk", nonPlaceholderIds],
    queryFn: () =>
      galleryService.getGalleryItemsBulk({ ids: nonPlaceholderIds }),
    enabled: nonPlaceholderIds.length > 0,
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });

  // Calculate the actual number of images for this moodboard (same logic as MoodboardLayout)
  const noOfImagesForMoodboard = useMemo(() => {
    if (!selectedMoodboard?.moodboard_assets) {
      return MIN_IMAGES_REQUIRED;
    }
    // Use the maximum position + 1, or minimum required, whichever is larger
    const maxPosition = Math.max(
      ...selectedMoodboard.moodboard_assets.map((asset) => asset.position || 0),
      -1
    );
    return Math.max(maxPosition + 1, MIN_IMAGES_REQUIRED);
  }, [selectedMoodboard?.moodboard_assets]);

  // Helper function to create a placeholder photo
  const createPlaceholderPhoto = useCallback(
    (id: string, position: number): UnifiedMoodboardItem => {
      return {
        id,
        src: "",
        width: 300,
        height: 300,
        alt: `Placeholder ${position + 1}`,
        liked: false,
        is_placeholder: true,
        position,
      };
    },
    []
  );

  // Function to process moodboard assets into items
  const processAssetsToItems = useCallback(
    (
      assets: any[],
      galleryItems: GalleryItemResponse[]
    ): UnifiedMoodboardItem[] => {
      if (!assets || assets.length === 0) return [];

      const itemsToLoad = assets
        .map((asset) => {
          // Check if this is a placeholder
          if (String(asset.gallery_item_id).startsWith("placeholder")) {
            return {
              id: asset.gallery_item_id,
              src: "",
              position: asset.position || 0,
              width: 300,
              height: 300,
              is_placeholder: true,
              is_liked: false,
            };
          }

          const galleryItem = galleryItems.find(
            (item) => item.id === asset.gallery_item_id
          );

          // If gallery item is not found, render as placeholder
          if (!galleryItem) {
            return {
              id: `placeholder-${asset.position || 0}`,
              src: "",
              position: asset.position || 0,
              width: 300,
              height: 300,
              is_placeholder: true,
              is_liked: false,
            };
          }

          return {
            id: asset.gallery_item_id,
            src: galleryItem.asset_url || "",
            position: asset.position || 0,
            width: galleryItem.dimensions?.width || 300,
            height: galleryItem.dimensions?.height || 300,
            is_placeholder: false,
            is_liked: galleryItem.is_favourite || false,
          };
        })
        .filter((item) => item !== null);

      return itemsToLoad
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          id: item.id,
          src: item.src,
          width: item.width,
          height: item.height,
          alt: `Image ${item.id}`,
          liked: item.is_liked,
          is_placeholder: item.is_placeholder,
          position: item.position,
        }));
    },
    []
  );

  // Function to fill missing positions with placeholders
  const fillWithPlaceholders = useCallback(
    (
      loadedItems: UnifiedMoodboardItem[],
      targetCount: number
    ): UnifiedMoodboardItem[] => {
      const result = [...loadedItems];

      // Fill missing positions with placeholders up to targetCount
      for (let i = 0; i < targetCount; i++) {
        const existingItem = result.find((item, index) => index === i);
        if (!existingItem) {
          result.splice(i, 0, createPlaceholderPhoto(`placeholder-${i}`, i));
        }
      }

      // Remove any items beyond targetCount
      if (result.length > targetCount) {
        return result.slice(0, targetCount);
      }

      return result;
    },
    [createPlaceholderPhoto]
  );

  // Load images from ordered gallery items using the same logic as MoodboardLayout
  const loadImagesWithDimensions = useCallback(async () => {
    if (!selectedMoodboard) {
      setItems([]);
      return;
    }

    setLoading(true);

    try {
      const hasMoodboardAssets =
        selectedMoodboard.moodboard_assets &&
        selectedMoodboard.moodboard_assets.length > 0;

      let loaded: UnifiedMoodboardItem[] = [];

      if (hasMoodboardAssets) {
        loaded = processAssetsToItems(
          selectedMoodboard.moodboard_assets,
          bulkGalleryItems
        );
      }

      // Fill with placeholders using the same logic as MoodboardLayout
      loaded = fillWithPlaceholders(loaded, noOfImagesForMoodboard);

      setItems(loaded);
    } catch (error) {
      console.error("Failed to load reference images:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [
    selectedMoodboard,
    bulkGalleryItems,
    noOfImagesForMoodboard,
    processAssetsToItems,
    fillWithPlaceholders,
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (val === "") {
      setN("");
      return;
    }

    const num = parseInt(val, 10);

    if (!isNaN(num) && num >= 1 && num <= 3) {
      setN(num);
    }
  };

  // Load images when selected moodboard or bulk gallery items change
  useEffect(() => {
    if (selectedMoodboard && bulkGalleryItems) {
      const timeoutId = setTimeout(() => {
        loadImagesWithDimensions();
      }, 50);
      return () => clearTimeout(timeoutId);
    } else {
      // Clear items if no moodboard
      setItems([]);
    }
  }, [
    selectedMoodboard?.id,
    bulkGalleryItems.length,
    noOfImagesForMoodboard,
    loadImagesWithDimensions,
  ]);

  // Display logic - show gallery if we have items and not loading
  const showGallery = useMemo(() => {
    return items.length > 0 && !loading && !isBulkFetching && !isBulkLoading;
  }, [items.length, loading, isBulkFetching, isBulkLoading]);

  // Calculate total images for moodboard - use the calculated value
  const totalImagesForMoodboard = noOfImagesForMoodboard;

  useEffect(() => {
    if (prompts && prompts.length > 0) {
      setN(prompts.length);
    }
  }, [prompts]);

  const latestMoodboardRef = useRef<MoodboardInformation | null>(null);
  const latestGalleryItemsRef = useRef<GalleryItemResponse[]>([]);

  // Keep track of latest values
  useEffect(() => {
    latestMoodboardRef.current = selectedMoodboard || null;
  }, [selectedMoodboard]);

  useEffect(() => {
    latestGalleryItemsRef.current = bulkGalleryItems;
  }, [bulkGalleryItems]);

  // Handle the case where the reference moodboard is deleted
  useEffect(() => {
    if (referenceMoodboardId && moodboardInformation && !selectedMoodboard) {
      // The reference moodboard ID exists but the moodboard is not found (deleted)
      updateA2iRefernceMoodboard(selectedBrandId!, null);
    }
  }, [
    referenceMoodboardId,
    selectedMoodboard,
    moodboardInformation,
    selectedBrandId,
  ]);

  // Handle moodboard selection change - this will propagate to other sections
  const handleMoodboardSelectionChange = async (
    moodboard: MoodboardInformation | null
  ) => {
    if (!moodboard) {
      // Handle case where moodboard is set to null (e.g., when deleted)
      setSelectedMoodboardId(null);
      await updateA2iRefernceMoodboard(selectedBrandId!, null);
      return;
    }

    setSelectedMoodboardId(moodboard.id!);
    if (moodboard && selectedMoodboard?.campaign_id) {
      setCampaignMoodboardSelection(
        selectedMoodboard.campaign_id,
        moodboard.id
      );
    }
    await updateA2iRefernceMoodboard(selectedBrandId!, moodboard.id!);
  };

  return (
    <ContentSection
      title="Reference Moodboard"
      showCopy={false}
      showPin={false}
      context={{ data: {} }}
      content={
        <div className="space-y-8">
          {/* Handle case when reference moodboard is null (deleted) */}
          {!selectedMoodboard && referenceMoodboardId ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <p className="text-gray-500 text-center">
                The reference moodboard has been deleted or is no longer
                available.
              </p>
              {moodboardInformation && moodboardInformation.length > 0 && (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600">
                    Select a different moodboard:
                  </p>
                  <MoodboardSelector
                    campaignId={moodboardInformation[0].campaign_id!}
                    moodboards={moodboardInformation}
                    selectedMoodboard={null}
                    setSelectedMoodboard={handleMoodboardSelectionChange}
                    isCreatingNew={false}
                    onNewMoodboard={() => {}}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <p className="font-semibold text-sm text-gray-600 break-words max-w-xs">
                  {selectedMoodboard?.title}
                </p>

                {moodboardInformation && selectedMoodboard?.campaign_id && (
                  <MoodboardSelector
                    campaignId={selectedMoodboard.campaign_id}
                    moodboards={moodboardInformation}
                    selectedMoodboard={selectedMoodboard}
                    setSelectedMoodboard={handleMoodboardSelectionChange}
                    isCreatingNew={false}
                    onNewMoodboard={() => {}}
                  />
                )}
              </div>
              {/* Show skeleton when switching */}
              {!showGallery || !selectedMoodboard ? (
                <ManualMoodboardSkeleton shimmer showButton={false} />
              ) : (
                <div className="mx-auto max-w-7xl w-full px-2">
                  <CustomGalleryContainer
                    items={items}
                    setItems={setItems}
                    noOfImagesForMoodboard={totalImagesForMoodboard}
                    setNoOfImagesForMoodboard={() => {}}
                    moodboard={selectedMoodboard}
                    hasUnsavedChanges={false}
                    isPreview
                    key={selectedMoodboard?.id}
                  />
                </div>
              )}

              {prompts && prompts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold">Prompts</h3>
                      <Input
                        type="number"
                        value={n}
                        onChange={handleChange}
                        onPaste={(e) => e.preventDefault()} // Disable paste
                        min={1}
                        max={3}
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </div>
                    {referenceMoodboardId && (
                      <Button
                        variant={"outline"}
                        className="text-primary border-primary"
                        disabled={isPending}
                        onClick={() => {
                          const hasTags =
                            selectedMoodboard?.moodboard_tags &&
                            Object.keys(selectedMoodboard.moodboard_tags)
                              .length > 0 &&
                            Object.values(
                              selectedMoodboard.moodboard_tags
                            ).some((tagArray) => tagArray.length > 0);

                          if (hasTags) {
                            generateShowboard(undefined, {
                              onSuccess: () => {
                                toast.success(
                                  "Concept Visual prompts generated successfully!"
                                );
                              },
                              onError: () => {
                                toast.error(
                                  "Failed to generate concept Visual prompts. Please try again."
                                );
                              },
                            });
                          } else {
                            toast.warning(
                              "Please ensure your moodboard has at least one image with tags before generating prompts."
                            );
                          }
                        }}
                      >
                        <WandSparkles />
                        {isPending
                          ? "Generating prompts..."
                          : "Generate Prompts"}
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 auto">
                    {prompts.map((prompt) => (
                      <div key={prompt} className="relative">
                        <Textarea
                          value={prompt}
                          readOnly
                          className="min-h-40 max-h-40 scrollbar"
                        />
                        <Button
                          variant="ghost"
                          className="absolute bottom-2 right-2"
                          size="icon"
                          onClick={() => {
                            if (formRef.current) {
                              setReferencePrompt(prompt);
                              formRef.current.scrollIntoView({
                                behavior: "smooth",
                              });
                            }
                          }}
                        >
                          <EditIcon />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      }
    />
  );
};

export default ReferenceMoodboard;
