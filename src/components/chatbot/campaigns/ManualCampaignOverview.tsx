import { ContentSection } from "@/components/shared/ContentSection";
import { InlineEditableField } from "@/components/shared/InlineEditableField";
import { InlineEditableBadges } from "@/components/shared/InlineEditableBadges";
import React from "react";

interface ManualCampaignOverviewProps {
  title?: string;
  description?: string;
  tone?: string[];
  campaignId?: string;
  onSave: (field: string, value: string | string[]) => void;
}

export const ManualCampaignOverview: React.FC<ManualCampaignOverviewProps> = ({
  title,
  description,
  tone = [],
  campaignId,
  onSave,
}) => {
  return (
    <ContentSection
      title={`Campaign Concept: "${title || "Unnamed Campaign"}"`}
      content={
        <div className="space-y-3">
          {/* Campaign Description */}
          <InlineEditableField
            key={description}
            label=""
            value={description || ""}
            onSave={async (newVal) => {
              onSave("description", newVal);
            }}
            textClassName="text-sm text-gray-700"
            showLabel={false}
            isTextarea={true}
          />

          {/* Campaign Tone */}

          <InlineEditableBadges
            label="Tone"
            values={tone}
            onSave={async (newTones) => {
              onSave("tone", newTones);
            }}
            showLabel={false}
          />
        </div>
      }
      context={undefined}
    />
  );
};
