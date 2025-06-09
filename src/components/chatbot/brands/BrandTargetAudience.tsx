import { ContentSection } from "@/components/shared/ContentSection";
import { InlineEditableField } from "@/components/shared/InlineEditableField";
import { formatUpdateMessage } from "@/lib/langgraph.utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { Agents } from "@/types/types";
import React from "react";

interface BrandTargetAudienceProps {
  targetAudience: string | null | undefined;
}

export const BrandTargetAudience: React.FC<BrandTargetAudienceProps> = ({
  targetAudience,
}) => {
  if (!targetAudience) return null;

  const stream = useStreamContext();
  const { user } = useUserStore();
  const { selectedBrandId } = useBrandStore();

  return (
    <ContentSection
      title="Target Audience"
      content={
        <div className="flex flex-col">
          <InlineEditableField
            label="target_audience"
            value={targetAudience}
            onSave={async (newVal) => {
              const oldVal = targetAudience;
              const msg = formatUpdateMessage(
                `static.target_audience`,
                oldVal,
                newVal,
                "brandingAgent",
                "Target Audience"
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
            isTextarea={true}
          />
        </div>
      }
      context={{
        agentId: Agents.BRANDING_AGENT,
        data: {
          targetAudience,
        },
      }}
    />
  );
};
