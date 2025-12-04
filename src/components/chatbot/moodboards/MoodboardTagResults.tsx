import React, { useState, useEffect } from "react";
import { capitalizeKey } from "@/lib/langgraph.utils";
import { MoodboardAsset, MoodboardInformation } from "@/types/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import {
  generateA2iShowboard,
  patchMoodboard,
  generateMoodboardScreenshot,
} from "@/services/api/moodboard.service";
import { useBrandStore } from "@/store/brand.store";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import {
  MoodboardPatchRequest,
  GenerateMoodboardScreenshotRequest,
} from "@/types/moodboard.types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useA2iStore } from "@/store/a2i.store";
import { useGalleryQuery } from "@/hooks/useGallery";
import type {
  GalleryItem,
  BulkGalleryUploadRequest,
} from "@/types/gallery.types";
import { useMoodboardStore } from "@/store/moodboard.store";

type Props = {
  moodboard_tags?: Record<string, string[]>;
  selected_moodboard_tags?: Record<string, string[]>;
  moodboardId?: MoodboardInformation["id"];
  campaignId?: string;
  showAdvancedSettings?: boolean;
  isGalleryItemsProcessing?: boolean;
  moodboardAssets: MoodboardAsset[];
};

function MoodboardTagResults({
  moodboard_tags,
  selected_moodboard_tags,
  moodboardId,
  campaignId,
  showAdvancedSettings = false,
  isGalleryItemsProcessing = false,
  moodboardAssets,
}: Props) {
  const [localTags, setLocalTags] = useState<
    Record<string, { value: string; selected: boolean }[]>
  >({});

  const { selectedBrandId, isMoodboardSaving } = useBrandStore();

  const { triggerMoodboardSave } = useMoodboardStore();

  const { isGeneratingPrompts, setIsGeneratingPrompts } = useA2iStore();

  const [isGeneratingScreenshot, setIsGeneratingScreenshot] = useState(false);

  // Gallery actions for uploading screenshot
  const galleryActions = useGalleryQuery({
    selectedFilters: {
      brands: [selectedBrandId!],
      campaigns: [],
      moodboards: [],
      product_categories: [],
      asset_types: ["image"],
      asset_sources: [],
      media_format: [],
      aspect_ratio: [],
      workflow_status: [],
    },
  });

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
    onSettled: () => {
      setIsGeneratingPrompts(false);
    },
  });

  // Initialize localTags from both moodboard_tags & selected_moodboard_tags
  useEffect(() => {
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
  }, [moodboardId, moodboardAssets]);
  const toggleTag = (category: string, value: string) => {
    setLocalTags((prev) => ({
      ...prev,
      [category]: prev[category].map((tag) =>
        tag.value === value ? { ...tag, selected: !tag.selected } : tag
      ),
    }));
  };

  const handleGenerate = async () => {
    if (!selectedBrandId || !campaignId || !moodboardId) {
      toast.error("Missing required information");
      return;
    }

    try {
      setIsGeneratingScreenshot(true);

      // Set generating state BEFORE starting the mutation
      setIsGeneratingPrompts(true);
      if (triggerMoodboardSave) {
        await triggerMoodboardSave();
      }

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

      // Run screenshot generation and concept visual generation in parallel
      // Screenshot generation won't block concept visual generation
      const screenshotPromise = (async () => {
        try {
          // Generate moodboard screenshot using backend API
          const screenshotPayload: GenerateMoodboardScreenshotRequest = {
            show_logo: true,
            show_title: true,
            show_footer: true,
          };

          const result = await generateMoodboardScreenshot(
            selectedBrandId,
            campaignId,
            moodboardId,
            screenshotPayload
          );

          const screenshotUrl = result.url;

          // Upload screenshot to gallery
          if (screenshotUrl) {
            const galleryItem: GalleryItem = {
              brand_id: selectedBrandId,
              campaign_id: campaignId,
              moodboard_id: moodboardId,
              asset_title: `Moodboard Screenshot - ${new Date().toLocaleString()}`,
              asset_url: screenshotUrl,
              asset_type: "image",
              asset_source: "moodboard",
              size: "unknown",
              media_format: "png",
              is_master: true,
              processing_status: "ready",
            };

            const bulkUploadRequest: BulkGalleryUploadRequest = {
              gallery_items: [galleryItem],
              brand_id: selectedBrandId,
              campaign_id: campaignId,
              moodboard_id: moodboardId,
            };

            await galleryActions.bulkUpload(bulkUploadRequest);
            toast.success("Moodboard screenshot added to gallery!");
          }
        } catch (error) {
          console.error("Failed to generate/upload screenshot:", error);
          toast.warning(
            "Screenshot generation failed, but continuing with concept visual generation"
          );
        } finally {
          setIsGeneratingScreenshot(false);
        }
      })();

      // Start concept visual generation immediately (doesn't wait for screenshot)
      generateShowboard(undefined, {
        onSuccess: () => {
          toast.success("Concept Visual prompts generated successfully!");
        },
        onError: (error) => {
          console.error("Generation failed:", error);
          toast.error(
            "Failed to generate Concept Visual prompts. Please try again."
          );
          setIsGeneratingPrompts(false);
        },
      });

      // Don't await - let it run in background
      screenshotPromise.catch(() => {
        // Error already handled in the promise
      });
    } catch (err) {
      console.error("Error in handleGenerate:", err);
      toast.error("Failed to start generation process.");
      setIsGeneratingScreenshot(false);
      setIsGeneratingPrompts(false);
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
                  isGeneratingScreenshot ||
                  isGalleryItemsProcessing ||
                  isMoodboardSaving
                }
              >
                {isPatching || isGeneratingPrompts || isGeneratingScreenshot ? (
                  <Loader />
                ) : (
                  <>Use Moodboard for Concept Visual Generation</>
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
