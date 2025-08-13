import React, { useState, useEffect } from "react";
import { capitalizeKey } from "@/lib/langgraph.utils";
import { MoodboardInformation } from "@/types/types";
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

type Props = {
  moodboard_tags?: Record<string, string[]>;
  selected_moodboard_tags?: Record<string, string[]>;
  moodboardId?: MoodboardInformation["id"];
  showAdvancedSettings?: boolean;
  isGalleryItemsProcessing?: boolean;
};

function MoodboardTagResults({
  moodboard_tags,
  selected_moodboard_tags,
  moodboardId,
  showAdvancedSettings = false,
  isGalleryItemsProcessing = false,
}: Props) {
  const [localTags, setLocalTags] = useState<
    Record<string, { value: string; selected: boolean }[]>
  >({});

  console.log("selected_moodboard_tags", selected_moodboard_tags);

  const { selectedBrandId } = useBrandStore();

  // Mutation for patching
  const { mutateAsync: patchMoodboardMutate, isPending: isSaving } =
    useMutation({
      mutationFn: (payload: MoodboardPatchRequest) =>
        patchMoodboard(selectedBrandId!, moodboardId!, payload),
    });

  // Mutation for generating showboard
  const { mutate: generateShowboard, isPending: isGenerating } = useMutation({
    mutationFn: () => generateA2iShowboard(selectedBrandId!, moodboardId!),
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

  const handleGenerate = async () => {
    try {
      // Prepare selected_moodboard_tags payload
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

      // Then trigger generation
      generateShowboard(undefined, {
        onSuccess: () => {
          toast.success("Concept Visual prompts generated successfully!");
        },
        onError: () => {
          toast.error(
            "Failed to generate Concept Visual prompts. Please try again."
          );
        },
      });
    } catch (err) {
      console.error(err);
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
                        onClick={() => toggleTag(category, tag.value)}
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
                disabled={isSaving || isGenerating || isGalleryItemsProcessing}
              >
                {isSaving || isGenerating ? (
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
