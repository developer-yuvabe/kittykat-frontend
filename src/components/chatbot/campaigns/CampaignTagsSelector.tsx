"use client";

import type React from "react";
import { useState } from "react";
import { updateCampaign } from "@/services/api/campaign.service";
import { useBrandStore } from "@/store/brand.store";
import type { ThreadCampaign } from "@/types/types";
import { Loader } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CampaignTagsSelectorProps {
  campaign: ThreadCampaign;
}

const CampaignTagsSelector: React.FC<CampaignTagsSelectorProps> = ({
  campaign,
}) => {
  const { selectedBrandId } = useBrandStore();
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});

  const toggleTag = async (parentKey: string, tagValue: string) => {
    if (!selectedBrandId) return;

    // Track updating state for this specific tag
    setIsUpdating((prev) => ({
      ...prev,
      [`${parentKey}-${tagValue}`]: true,
    }));

    try {
      // Create updated tags structure
      const updatedTags = {
        ...campaign.tags,
        [parentKey]: campaign.tags[parentKey].map((tag) =>
          tag.value === tagValue ? { ...tag, selected: !tag.selected } : tag
        ),
      };

      // Update database
      await updateCampaign(selectedBrandId, campaign.id, {
        tags: updatedTags,
      });
    } catch (error) {
      console.error("Failed to update campaign tags:", error);
    } finally {
      // Clear updating state
      setIsUpdating((prev) => ({
        ...prev,
        [`${parentKey}-${tagValue}`]: false,
      }));
    }
  };

  // Don't render if no tags available
  if (!campaign.tags || Object.keys(campaign.tags).length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {Object.entries(campaign.tags).map(([parentKey, tags]) => (
        <div key={parentKey} className="space-y-3">
          {/* Parent Key Header */}
          <h3 className="text-base font-medium text-gray-800 capitalize">
            {parentKey.replace(/_/g, " ")}
          </h3>

          {/* Tags as Badges */}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isUpdatingTag = isUpdating[`${parentKey}-${tag.value}`];

              return (
                <Badge
                  key={tag.value}
                  onClick={() => toggleTag(parentKey, tag.value)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={tag.selected}
                  variant={tag.selected ? "default" : "outline"}
                  className={`
    cursor-pointer select-none
    disabled:opacity-50 disabled:cursor-not-allowed
    text-sm rounded-2xl
  `}
                >
                  {isUpdatingTag ? (
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

export default CampaignTagsSelector;
