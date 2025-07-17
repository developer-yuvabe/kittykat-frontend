"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useBrandStore } from "@/store/brand.store";
import type { MoodboardInformation } from "@/types/types";
import { Loader, Save, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { patchMoodboard } from "@/services/api/moodboard.service";

interface MoodboardTagsSelectorProps {
  moodboard: MoodboardInformation;
  onHasChanges?: (hasChanges: boolean) => void;
}

const MoodboardTagsSelector: React.FC<MoodboardTagsSelectorProps> = ({
  moodboard,
  onHasChanges,
}) => {
  const { selectedBrandId } = useBrandStore();
  const [localTags, setLocalTags] = useState(moodboard.aggregated_tags);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Check if there are changes between local and original tags
  useEffect(() => {
    const hasChangesCheck =
      JSON.stringify(localTags) !== JSON.stringify(moodboard.aggregated_tags);
    setHasChanges(hasChangesCheck);
    // Notify parent component about changes
    onHasChanges?.(hasChangesCheck);
  }, [localTags, moodboard.aggregated_tags, onHasChanges]);

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

  const saveChanges = async () => {
    if (!selectedBrandId || !hasChanges) return;

    setIsSaving(true);
    try {
      await patchMoodboard(selectedBrandId, moodboard.id, {
        aggregated_tags: localTags,
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save tags:", error);
      // Optionally show error message to user
    } finally {
      setIsSaving(false);
    }
  };

  const resetChanges = () => {
    setLocalTags(moodboard.aggregated_tags);
    setHasChanges(false);
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
            {tags.map((tag) => {
              return (
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
              );
            })}
          </div>
        </div>
      ))}
      {/* Save/Reset buttons */}
      {hasChanges && (
        <div className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-blue-700 font-medium">
              You have unsaved changes
            </span>
          </div>

          <Button
            onClick={saveChanges}
            disabled={isSaving}
            size="sm"
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>

          <Button
            onClick={resetChanges}
            disabled={isSaving}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      )}
    </div>
  );
};

export default MoodboardTagsSelector;
