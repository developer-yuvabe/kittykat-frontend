import { ContentSection } from "@/components/shared/ContentSection";
import { InlineEditableBadges } from "@/components/shared/InlineEditableBadges";
import { InlineEditableField } from "@/components/shared/InlineEditableField";
import {
  formatUpdateArrayMessage,
  formatUpdateMessage,
} from "@/lib/langgraph.utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { Agents } from "@/types/types";
import React from "react";

interface MoodboardOverviewOverviewProps {
  title?: string;
  description?: string;
  tone?: string[];
  campaignId?: string;
}

export const MoodboardOverview: React.FC<MoodboardOverviewOverviewProps> = ({
  title,
  description,
  tone = [],
  campaignId,
}) => {
  const stream = useStreamContext();
  const { user } = useUserStore();
  const { selectedBrandId } = useBrandStore();

  return (
    <ContentSection
      title={`Moodboard's Campaign Concept: “${title}”`}
      content={
        <div className="space-y-3">
          <InlineEditableField
            key={description}
            label="Tagline"
            value={description || ""}
            onSave={async (newVal) => {
              const oldVal = description || "";
              const msg = formatUpdateMessage(
                "campaign.description",
                oldVal,
                newVal,
                "campaignAgent",
                "Tagline",
                `You should update the campaign ${title} and the campaignId is ${campaignId}`
              );
              if (msg) {
                submitOptimisticMessage({
                  stream,
                  text: msg,
                  userId: user!.id,
                  currentBrandContextId: selectedBrandId,
                });
              }
            }}
            textClassName="text-sm text-gray-700"
            showLabel={false}
            isTextarea={true}
            enableEdit={false}
          />

          {/* Values */}
          {tone.length > 0 && (
            <div className="flex flex-col">
              <div className="flex flex-wrap gap-1 mt-1">
                <InlineEditableBadges
                  label="Tone"
                  values={tone}
                  onSave={async (newTones) => {
                    const message = formatUpdateArrayMessage(
                      "campaign.tone",
                      tone,
                      newTones,
                      "campaignAgent",
                      "Tone",
                      `You should update the campaign ${title} and the campaignId is ${campaignId}`
                    );

                    if (message) {
                      submitOptimisticMessage({
                        stream,
                        text: message,
                        userId: user!.id,
                        currentBrandContextId: selectedBrandId,
                      });
                    }
                  }}
                  showLabel={false}
                  enableEdit={false}
                />
              </div>
            </div>
          )}
        </div>
      }
      context={{
        agentId: Agents.CAMPAIGN_AGENT,
        data: {
          title,
          description,
          tone,
        },
      }}
    />
  );
};
