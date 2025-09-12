import React, { useState, useEffect, RefObject } from "react";
import { capitalizeKey } from "@/lib/langgraph.utils";
import {
  MoodboardAsset,
  MoodboardInformation,
  ThreadCampaign,
} from "@/types/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import {
  generateA2iShowboard,
  patchMoodboard,
} from "@/services/api/moodboard.service";
import { useBrandStore } from "@/store/brand.store";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import { MoodboardPatchRequest } from "@/types/moodboard.types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GalleryActions } from "@/hooks/useGallery";
import { GalleryItem, BulkGalleryUploadRequest } from "@/types/gallery.types";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { CustomGalleryGridRef } from "@/components/gallery/CustomGalleryGrid";
import { dataURLToBlob } from "@/lib/utils";
import { useA2iStore } from "@/store/a2i.store";

type Props = {
  moodboard_tags?: Record<string, string[]>;
  selected_moodboard_tags?: Record<string, string[]>;
  moodboardId?: MoodboardInformation["id"];
  showAdvancedSettings?: boolean;
  isGalleryItemsProcessing?: boolean;
  galleryActions?: GalleryActions;
  currentCampaign?: ThreadCampaign | null;
  galleryGridRef?: RefObject<CustomGalleryGridRef | null>;
  moodboardAssets: MoodboardAsset[];
};

function MoodboardTagResults({
  moodboard_tags,
  selected_moodboard_tags,
  moodboardId,
  showAdvancedSettings = false,
  isGalleryItemsProcessing = false,
  galleryActions,
  currentCampaign,
  galleryGridRef,
  moodboardAssets,
}: Props) {
  const [localTags, setLocalTags] = useState<
    Record<string, { value: string; selected: boolean }[]>
  >({});

  const { selectedBrandId, isMoodboardSaving } = useBrandStore();

  const { isGeneratingPrompts, setIsGeneratingPrompts } = useA2iStore();

  // Mutation for patching
  const { mutateAsync: patchMoodboardMutate, isPending: isPatching } =
    useMutation({
      mutationFn: (payload: MoodboardPatchRequest) =>
        patchMoodboard(selectedBrandId!, moodboardId!, payload),
    });

  // Mutation for generating showboard
  const { mutate: generateShowboard } = useMutation({
    mutationFn: () =>
      generateA2iShowboard(selectedBrandId!, moodboardId!, moodboardAssets),
    onMutate: () => {
      setIsGeneratingPrompts(true);
    },
    onSettled: () => {
      setIsGeneratingPrompts(false);
    },
  });

  // Initialize localTags from both moodboard_tags & selected_moodboard_tags
  useEffect(() => {
    // Reset tags when moodboard changes
    if (!moodboard_tags) {
      setLocalTags({});
      return;
    }
    const converted: Record<string, { value: string; selected: boolean }[]> =
      {};
    for (const [category, tags] of Object.entries(moodboard_tags)) {
      // Only include tags that exist in the current moodboard
      if (Array.isArray(tags)) {
        converted[category] = tags.map((tag) => ({
          value: tag,
          // Only mark as selected if the tag exists in both moodboard_tags and selected_moodboard_tags
          selected: selected_moodboard_tags?.[category]?.includes(tag) ?? false,
        }));
      }
    }
    setLocalTags(converted);
  }, [moodboard_tags, selected_moodboard_tags]);

  const toggleTag = (category: string, value: string) => {
    setLocalTags((prev) => ({
      ...prev,
      [category]: prev[category].map((tag) =>
        tag.value === value ? { ...tag, selected: !tag.selected } : tag
      ),
    }));
  };

  // Function to capture moodboard screenshot and upload to gallery
  const captureMoodboardAndUploadToGallery = async (): Promise<boolean> => {
    if (
      !galleryGridRef?.current ||
      !galleryActions ||
      !currentCampaign ||
      !selectedBrandId ||
      !moodboardId
    ) {
      console.warn("Missing required dependencies for screenshot capture");
      return false;
    }

    try {
      console.log("Starting screenshot capture...");

      // Add a timeout wrapper for the entire screenshot operation
      const screenshotPromise = galleryGridRef.current.captureScreenshot();
      const timeoutPromise = new Promise<string | null>((_, reject) => {
        setTimeout(
          () => reject(new Error("Screenshot operation timeout")),
          15000
        );
      });

      const dataURL = await Promise.race([screenshotPromise, timeoutPromise]);

      if (!dataURL) {
        throw new Error("Failed to capture screenshot - no data returned");
      }

      // Convert dataURL to blob
      const blob = dataURLToBlob(dataURL);

      // Create a File object from the blob
      const file = new File(
        [blob],
        `moodboard-${moodboardId}-${Date.now()}.png`,
        {
          type: "image/png",
        }
      );

      // Upload file to GCS
      const downloadUrl = await uploadFileAndReturnUrl(
        file.name,
        file.type,
        "brands",
        file,
        selectedBrandId,
        currentCampaign.id
      );

      // Prepare gallery item with moodboard asset source
      const galleryItem: GalleryItem = {
        brand_id: selectedBrandId,
        campaign_id: currentCampaign.id,
        moodboard_id: moodboardId,
        asset_title: `Moodboard Screenshot - ${new Date().toLocaleString()}`,
        asset_url: downloadUrl,
        asset_type: "image",
        asset_source: "moodboard",
        size: "unknown",
        media_format: "png",
        is_master: true,
      };

      // Upload to gallery using bulk upload
      const bulkUploadRequest: BulkGalleryUploadRequest = {
        gallery_items: [galleryItem],
        brand_id: selectedBrandId,
        campaign_id: currentCampaign.id,
        moodboard_id: moodboardId,
      };

      await galleryActions.bulkUpload(bulkUploadRequest);

      toast.success("Moodboard screenshot added to gallery successfully!");
      return true;
    } catch (error) {
      console.error("Error capturing moodboard screenshot:", error);
      toast.warning(
        `Failed to capture moodboard screenshot. Proceeding with generation anyway...`
      );
      return false;
    }
  };

  const handleGenerate = async () => {
    try {
      // Prepare selected_moodboard_tags payload first
      const selectedTagsPayload: Record<string, string[]> = {};
      for (const [category, tags] of Object.entries(localTags)) {
        selectedTagsPayload[category] = tags
          .filter((tag) => tag.selected)
          .map((tag) => tag.value);
      }

      // Save to backend before generating
      await patchMoodboardMutate({
        selected_moodboard_tags: selectedTagsPayload,
      });

      // Try to capture screenshot in parallel (don't wait for it)
      // This prevents the screenshot from blocking the generation
      if (
        galleryGridRef?.current &&
        galleryActions &&
        currentCampaign &&
        selectedBrandId &&
        moodboardId
      ) {
        captureMoodboardAndUploadToGallery().catch((error) => {
          console.error(
            "Screenshot capture failed but continuing with generation:",
            error
          );
        });
      }

      // Start generation immediately
      generateShowboard(undefined, {
        onSuccess: () => {
          toast.success("Concept Visual prompts generated successfully!");
        },
        onError: (error) => {
          console.error("Generation failed:", error);
          toast.error(
            "Failed to generate Concept Visual prompts. Please try again."
          );
        },
      });
    } catch (err) {
      console.error("Error in handleGenerate:", err);
      toast.error("Failed to save selected tags before generation.");
    }
  };

  if (!localTags || Object.keys(localTags).length === 0) return null;

  return (
    <div className="mt-4">
      <div className="space-y-6">
        {/* Moodboard Tags - Only shown when advanced settings is enabled */}

        {showAdvancedSettings && (
          <>
            <p className="font-medium text-neutral-500 text-sm mb-2">
              Select the tags you want and hit &quot;Concept Visual
              Generation&quot; to generate the prompts that align with your
              moodboard for concept visuals.
            </p>
            <div className="space-y-6">
              {Object.entries(localTags).map(([category, tags]) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-base font-medium text-neutral-900 capitalize">
                    {capitalizeKey(category)}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.value}
                        onClick={() => {
                          if (isMoodboardSaving) {
                            toast.warning(
                              "Please wait until the moodboard is synced."
                            );
                            return;
                          }

                          toggleTag(category, tag.value);
                        }}
                        role="button"
                        tabIndex={0}
                        aria-pressed={tag.selected}
                        variant={tag.selected ? "default" : "outline"}
                        className={`cursor-pointer select-none text-sm rounded-2xl transition-all duration-200 hover:scale-105 ${
                          tag.selected ? "bg-[#7F55E0FF]" : "bg-[#F3F4F6FF]"
                        }`}
                      >
                        {tag.value}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <span className="w-full">
              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={
                  isPatching ||
                  isGeneratingPrompts ||
                  isGalleryItemsProcessing ||
                  isMoodboardSaving
                }
              >
                {isPatching || isGeneratingPrompts ? (
                  <Loader />
                ) : (
                  <>
                    <Brain /> Concept Visual Generation
                  </>
                )}
              </Button>
            </span>
          </TooltipTrigger>

          {isGalleryItemsProcessing && (
            <TooltipContent className="max-w-xs">
              Some items in the your brand are still being analysed. Please wait
              till completion.
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </div>
  );
}

export default MoodboardTagResults;
