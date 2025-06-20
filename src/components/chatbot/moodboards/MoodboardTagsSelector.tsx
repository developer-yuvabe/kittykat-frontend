"use client";

import type React from "react";
import { useState } from "react";
import { useBrandStore } from "@/store/brand.store";
import type { MoodboardInformation } from "@/types/types";
import { Loader } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { patchMoodboard } from "@/services/api/moodboard.service";

interface MoodboardTagsSelectorProps {
  moodboard: MoodboardInformation;
}

const MoodboardTagsSelector: React.FC<MoodboardTagsSelectorProps> = ({
  moodboard,
}) => {
  const { selectedBrandId } = useBrandStore();
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});

  const toggleTag = async (category: string, tagValue: string) => {
    if (!selectedBrandId) return;

    const updateKey = `${category}-${tagValue}`;
    setIsUpdating((prev) => ({ ...prev, [updateKey]: true }));

    try {
      // Build new tag selection state
      const updatedTags = {
        ...moodboard.aggregated_tags,
        [category]: moodboard.aggregated_tags[category].map((tag) =>
          tag.value === tagValue ? { ...tag, selected: !tag.selected } : tag
        ),
      };

      await patchMoodboard(selectedBrandId, moodboard.id, {
        aggregated_tags: updatedTags,
      });
    } catch (error) {
      console.error("Failed to update tags:", error);
    } finally {
      setIsUpdating((prev) => ({ ...prev, [updateKey]: false }));
    }
  };

  if (
    !moodboard.aggregated_tags ||
    Object.keys(moodboard.aggregated_tags).length === 0
  ) {
    return null;
  }

  return (
    <div className="space-y-6">
      {Object.entries(moodboard.aggregated_tags).map(([category, tags]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-base font-medium text-gray-800 capitalize">
            {category.replace(/_/g, " ")}
          </h3>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isTagUpdating = isUpdating[`${category}-${tag.value}`];

              return (
                <Badge
                  key={tag.value}
                  onClick={() => toggleTag(category, tag.value)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={tag.selected}
                  variant={tag.selected ? "default" : "outline"}
                  className="cursor-pointer select-none disabled:opacity-50 text-sm rounded-2xl"
                >
                  {isTagUpdating ? (
                    <span className="inline-flex items-center">
                      <Loader className="w-3 h-3 mr-2 animate-spin" />
                      {tag.value}
                    </span>
                  ) : (
                    tag.value
                  )}
                </Badge>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MoodboardTagsSelector;
