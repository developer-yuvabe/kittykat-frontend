"use client";

import type React from "react";
import { useState, useEffect } from "react";
import type { MoodboardInformation } from "@/types/types";
import { Badge } from "@/components/ui/badge";

interface MoodboardTagsSelectorProps {
  moodboard: MoodboardInformation | null;
  onHasChanges?: (hasChanges: boolean) => void;
  onTagsChange?: (tags: MoodboardInformation["aggregated_tags"]) => void;
  brandTags?: Record<string, string[]>; // category -> tag values
}

const MoodboardTagsSelector: React.FC<MoodboardTagsSelectorProps> = ({
  moodboard,
  onHasChanges,
  onTagsChange,
  brandTags,
}) => {
  const [localTags, setLocalTags] = useState<
    MoodboardInformation["aggregated_tags"]
  >({});

  // Initialize local tags from brandTags + moodboard selections
  useEffect(() => {
    if (!brandTags) return;

    const converted: MoodboardInformation["aggregated_tags"] = {};

    for (const [category, brandTagValues] of Object.entries(brandTags)) {
      const selectedFromMoodboard =
        moodboard?.aggregated_tags?.[category]?.filter((t) => t.selected) ?? [];

      let selectedSet = new Set<string>();

      if (selectedFromMoodboard.length === 0) {
        const shuffled = [...brandTagValues].sort(() => 0.5 - Math.random());
        const halfCount = Math.ceil(shuffled.length / 2);
        selectedSet = new Set(shuffled.slice(0, halfCount));
      } else {
        selectedSet = new Set(selectedFromMoodboard.map((t) => t.value));
      }

      converted[category] = brandTagValues.map((tagValue) => ({
        value: tagValue,
        selected: selectedSet.has(tagValue),
      }));
    }

    setLocalTags(converted);
  }, [brandTags, moodboard?.aggregated_tags]);

  // Track and propagate changes
  useEffect(() => {
    const original = moodboard?.aggregated_tags ?? {};
    const changed = JSON.stringify(localTags) !== JSON.stringify(original);
    onHasChanges?.(changed);
    onTagsChange?.(localTags);
  }, [localTags]);

  const toggleTag = (category: string, value: string) => {
    setLocalTags((prev) => ({
      ...prev,
      [category]: prev[category].map((tag) =>
        tag.value === value ? { ...tag, selected: !tag.selected } : tag
      ),
    }));
  };

  if (!localTags || Object.keys(localTags).length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
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
