import { ContentSection } from "@/components/shared/ContentSection";
import { Agents } from "@/types/types";
import React from "react";

interface BrandTargetAudienceProps {
  targetAudience: string | null | undefined;
}

export const BrandTargetAudience: React.FC<BrandTargetAudienceProps> = ({
  targetAudience,
}) => {
  if (!targetAudience) return null;

  return (
    <ContentSection
      title="Target Audience"
      content={
        <div className="flex flex-col">
          <span className="text-sm text-gray-700">{targetAudience}</span>
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
