import { ContentSection } from "@/components/shared/ContentSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateA2iShowboard } from "@/services/api/moodboard.service";
import { galleryService } from "@/services/api/gallery.service";
import { useBrandStore } from "@/store/brand.store";
import {
  MoodboardAsset,
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
  referenceMoodboardAssets: ThreadA2iImage["reference_moodboard_assets"];
  prompts: ThreadA2iImage["prompts"];
  moodboardInformation: ThreadDetails["moodboard_information"];
  formRef: RefObject<HTMLDivElement | null>;
  campaignInformation: ThreadDetails["campaign_information"];
  selectedCampaignIndex: number;
};

const ReferenceMoodboard = ({
  referenceMoodboardId,
  referenceMoodboardAssets: referenceMoodboardAssetsProp,
  prompts,
  moodboardInformation,
  formRef,
  campaignInformation,
  selectedCampaignIndex,
}: ReferenceMoodboardProps) => {
  const { setReferencePrompt, isGeneratingPrompts, setIsGeneratingPrompts } =
    useA2iStore();
  const { setCampaignMoodboardSelection, setSelectedMoodboardId } =
    useBrandStore();
  const [n, setN] = useState<number | "">(prompts?.length || "");
  const [items, setItems] = useState<UnifiedMoodboardItem[]>([]);
  const [loading, setLoading] = useState(false);

  const { selectedBrandId } = useBrandStore();
  const { mutate: generateShowboard } = useMutation({
    mutationFn: ({
      brandId,
      moodboardId,
      numberOfPrompts,
      referenceMoodboardAssets,
    }: {
      brandId: string;
      moodboardId: string;
      numberOfPrompts: number;
      referenceMoodboardAssets?: MoodboardAsset[];
    }) =>
      generateA2iShowboard(
        brandId,
        moodboardId,
        referenceMoodboardAssets,
        numberOfPrompts
      ),
    onMutate: () => {
      setIsGeneratingPrompts(true);
    },
    onSuccess: () => {
      toast.success("Concept Visual prompts generated successfully!");
      setIsGeneratingPrompts(false);
    },
    onError: () => {
      toast.error(
        "Failed to generate concept Visual prompts. Please try again."
      );
      setIsGeneratingPrompts(false);
    },
  });

  // Get the current campaign based on selectedCampaignIndex
  const currentCampaign = useMemo(
    () =>
      campaignInformation && campaignInformation[selectedCampaignIndex]
        ? campaignInformation[selectedCampaignIndex]
        : null,
    [campaignInformation, selectedCampaignIndex]
  );

  const selectedMoodboard = useMemo(
    () => moodboardInformation?.find((mb) => mb.id === referenceMoodboardId),
    [moodboardInformation, referenceMoodboardId]
  );

  const referenceMoodboardAssets = useMemo(() => {
    return referenceMoodboardAssetsProp || [];
  }, [referenceMoodboardAssetsProp]);

  // Create a stable key for tracking asset changes
  const assetsKey = useMemo(() => {
    if (!referenceMoodboardAssets || referenceMoodboardAssets.length === 0) {
      return "empty";
    }
    return referenceMoodboardAssets
      .map((asset) => `${asset.gallery_item_id}-${asset.position}`)
      .sort()
      .join("|");
  }, [referenceMoodboardAssets]);

  // Extract gallery item IDs from reference moodboard assets only
  const galleryItemIds = useMemo(() => {
    if (referenceMoodboardAssets && referenceMoodboardAssets.length > 0) {
      return referenceMoodboardAssets.map((asset) => asset.gallery_item_id);
    }
    return [];
  }, [referenceMoodboardAssets]);

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

  // Calculate the actual number of images for this moodboard
  const noOfImagesForMoodboard = useMemo(() => {
    if (!referenceMoodboardAssets || referenceMoodboardAssets.length === 0) {
      return MIN_IMAGES_REQUIRED;
    }
    // Use the maximum position + 1, or minimum required, whichever is larger
    const maxPosition = Math.max(
      ...referenceMoodboardAssets.map((asset) => asset.position || 0),
      -1
    );
    const calculatedCount = Math.max(maxPosition + 1, MIN_IMAGES_REQUIRED);
    // Ensure we have enough positions for proper 3-row layout
    // Check if we need more items to fill the 3rd row properly
    if (calculatedCount >= 10 && calculatedCount < 16) {
      // For moodboards with 10-15 items, ensure we have at least 16 for a complete layout
      return Math.max(calculatedCount, 16);
    }
    return calculatedCount;
  }, [referenceMoodboardAssets]);

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
      const result: UnifiedMoodboardItem[] = [];

      // Create array with all positions filled
      for (let i = 0; i < targetCount; i++) {
        const existingItem = loadedItems.find((item) => item.position === i);
        if (existingItem) {
          result.push(existingItem);
        } else {
          // Create placeholder for missing position
          result.push(createPlaceholderPhoto(`placeholder-${i}`, i));
        }
      }

      return result.sort((a, b) => (a.position || 0) - (b.position || 0));
    },
    [createPlaceholderPhoto]
  );

  const loadImagesWithDimensions = useCallback(async () => {
    if (!selectedMoodboard) {
      setItems([]);
      return;
    }

    setLoading(true);

    try {
      let loaded: UnifiedMoodboardItem[] = [];

      // Always process reference moodboard assets if they exist
      if (referenceMoodboardAssets && referenceMoodboardAssets.length > 0) {
        loaded = processAssetsToItems(
          referenceMoodboardAssets,
          bulkGalleryItems
        );
      }

      // Always fill with placeholders to ensure proper grid layout
      loaded = fillWithPlaceholders(loaded, noOfImagesForMoodboard);

      setItems(loaded);
    } catch (error) {
      console.error("Failed to load reference images:", error);
      // Still create placeholders even if loading fails
      const placeholders = fillWithPlaceholders([], noOfImagesForMoodboard);
      setItems(placeholders);
    } finally {
      setLoading(false);
    }
  }, [
    selectedMoodboard,
    referenceMoodboardAssets,
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

  // Create a ref for the loadImagesWithDimensions function to avoid dependency issues
  const loadImagesRef = useRef<(() => Promise<void>) | null>(null);

  // Update the ref whenever the function changes
  useEffect(() => {
    loadImagesRef.current = loadImagesWithDimensions;
  }, [loadImagesWithDimensions]);

  useEffect(() => {
    if (selectedMoodboard && loadImagesRef.current) {
      console.log(
        "Loading images for moodboard:",
        selectedMoodboard.id,
        "with assets key:",
        assetsKey
      );
      const timeoutId = setTimeout(() => {
        loadImagesRef.current?.();
      }, 50);
      return () => clearTimeout(timeoutId);
    } else {
      setItems([]);
    }
  }, [
    selectedMoodboard?.id,
    assetsKey, // Use assetsKey instead of the full arrays to track content changes
    bulkGalleryItems.length,
    noOfImagesForMoodboard,
  ]);

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
    // Only run this effect if we have a reference moodboard ID but no selected moodboard
    if (
      referenceMoodboardId &&
      moodboardInformation &&
      !selectedMoodboard &&
      selectedBrandId
    ) {
      // The reference moodboard ID exists but the moodboard is not found (deleted)
      // Only call this once to avoid infinite loops
      const timeoutId = setTimeout(() => {
        updateA2iRefernceMoodboard(selectedBrandId, null);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [
    referenceMoodboardId,
    selectedMoodboard?.id, // Use id instead of the whole object
    moodboardInformation?.length, // Use length instead of the whole array
    selectedBrandId,
  ]);

  // Handle moodboard selection change - this will propagate to other sections
  const handleMoodboardSelectionChange = useCallback(
    async (moodboard: MoodboardInformation | null) => {
      try {
        if (!moodboard) {
          // Handle case where moodboard is set to null (e.g., when deleted)
          console.log("Setting moodboard to null");
          setSelectedMoodboardId(null);
          if (selectedBrandId) {
            await updateA2iRefernceMoodboard(selectedBrandId, null, []);
          }
          return;
        }

        console.log("Selecting new moodboard:", moodboard.id);
        setSelectedMoodboardId(moodboard.id!);

        // Set campaign moodboard selection if we have a campaign
        if (moodboard.campaign_id) {
          setCampaignMoodboardSelection(moodboard.campaign_id, moodboard.id);
        }

        console.log("moodboard assets", moodboard.moodboard_assets);

        // Use the mutation for consistency and proper error handling
        // Only generate if we're not already generating
        if (selectedBrandId && moodboard.id && !isGeneratingPrompts) {
          generateShowboard({
            brandId: selectedBrandId,
            moodboardId: moodboard.id,
            referenceMoodboardAssets: moodboard.moodboard_assets,
            numberOfPrompts: Number(n) || 1,
          });
        }
      } catch (error) {
        console.error("Error in handleMoodboardSelectionChange:", error);
      }
    },
    [
      selectedBrandId,
      setCampaignMoodboardSelection,
      setSelectedMoodboardId,
      generateShowboard,
      n,
      isGeneratingPrompts,
    ]
  );

  return (
    <ContentSection
      title="Reference Moodboard"
      showCopy={false}
      showPin={false}
      context={{ data: {} }}
      content={
        <div className="space-y-8">
          {/* Handle case when reference moodboard is null (deleted) */}
          {referenceMoodboardId === null ? (
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
                    campaignId={
                      currentCampaign?.id ||
                      moodboardInformation[0].campaign_id!
                    }
                    moodboards={moodboardInformation}
                    selectedMoodboard={null}
                    setSelectedMoodboard={handleMoodboardSelectionChange}
                    isCreatingNew={false}
                    onNewMoodboard={() => {}}
                    showAllCampaigns={true}
                  />
                </div>
              )}
            </div>
          ) : !selectedMoodboard && referenceMoodboardId ? (
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
                    campaignId={
                      currentCampaign?.id ||
                      moodboardInformation[0].campaign_id!
                    }
                    moodboards={moodboardInformation}
                    selectedMoodboard={null}
                    setSelectedMoodboard={handleMoodboardSelectionChange}
                    isCreatingNew={false}
                    onNewMoodboard={() => {}}
                    showAllCampaigns={true}
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
              {/* Show skeleton when loading or no selectedMoodboard */}
              {loading ||
              isBulkFetching ||
              isBulkLoading ||
              !selectedMoodboard ? (
                <ManualMoodboardSkeleton shimmer showButton={false} />
              ) : (
                <div className="mx-auto max-w-7xl w-full px-2">
                  <CustomGalleryContainer
                    items={items}
                    setItems={setItems}
                    moodboard={{
                      ...selectedMoodboard,
                      // Ensure the moodboard knows how many images it should have
                      moodboard_assets: items.map((item, index) => ({
                        gallery_item_id: item.id,
                        position: index,
                      })),
                    }}
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
                        disabled={isGeneratingPrompts}
                        onClick={() => {
                          const hasTags =
                            selectedMoodboard?.moodboard_tags &&
                            Object.keys(selectedMoodboard.moodboard_tags)
                              .length > 0 &&
                            Object.values(
                              selectedMoodboard.moodboard_tags
                            ).some((tagArray) => tagArray.length > 0);

                          if (hasTags) {
                            generateShowboard({
                              brandId: selectedBrandId!,
                              moodboardId: referenceMoodboardId!,
                              numberOfPrompts: Number(n),
                            });
                          } else {
                            toast.warning(
                              "Please ensure your moodboard has at least one image with tags before generating prompts."
                            );
                          }
                        }}
                      >
                        <WandSparkles />
                        {isGeneratingPrompts
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
