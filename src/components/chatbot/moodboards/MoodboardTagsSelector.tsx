"use client";

import type React from "react";
import { useState, useEffect } from "react";
import type { MoodboardInformation } from "@/types/types";
import { Badge } from "@/components/ui/badge";

interface MoodboardTagsSelectorProps {
  moodboard: MoodboardInformation;
  onHasChanges?: (hasChanges: boolean) => void;
  onTagsChange?: (tags: MoodboardInformation["aggregated_tags"]) => void;
}

const MoodboardTagsSelector: React.FC<MoodboardTagsSelectorProps> = ({
  moodboard,
  onHasChanges,
  onTagsChange,
}) => {
  const [localTags, setLocalTags] = useState(moodboard.aggregated_tags);
  const [hasChanges, setHasChanges] = useState(false);

  // Check if there are changes between local and original tags
  useEffect(() => {
    const hasChangesCheck =
      JSON.stringify(localTags) !== JSON.stringify(moodboard.aggregated_tags);
    setHasChanges(hasChangesCheck);
    onHasChanges?.(hasChangesCheck);
    onTagsChange?.(localTags);
  }, [localTags, moodboard.aggregated_tags]);

  // Reset local tags when moodboard changes (e.g., from external updates)
  useEffect(() => {
    setLocalTags(moodboard.aggregated_tags);
  }, [moodboard.aggregated_tags]);

  const toggleTag = (category: string, tagValue: string) => {
    setLocalTags((prevTags) => ({
      ...prevTags,
      [category]: prevTags[category].map((tag) =>
        tag.value === tagValue ? { ...tag, selected: !tag.selected } : tag
      ),
    }));
  };

  if (!localTags || Object.keys(localTags).length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Tags */}
      {Object.entries(localTags).map(([category, tags]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-base font-medium text-gray-800 capitalize">
            {category.replace(/_/g, " ")}
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
                className="cursor-pointer select-none text-sm rounded-2xl transition-all duration-200 hover:scale-105"
              >
                {tag.value}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MoodboardTagsSelector;
