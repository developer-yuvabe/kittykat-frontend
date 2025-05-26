import { ContentSection } from "@/components/shared/ContentSection";
import { Badge } from "@/components/ui/badge";
import { Agents } from "@/types/types";
import React from "react";

interface CampaignOverviewProps {
  title?: string;
  description?: string;
  tone?: string[];
}

export const CampaignOverview: React.FC<CampaignOverviewProps> = ({
  title,
  description,
  tone = [],
}) => {
  return (
    <ContentSection
      title={`Campaign Concept: “${title}”`}
      content={
        <div className="space-y-3">
          {/* Tagline */}
          {description && (
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">{description}</span>
            </div>
          )}

          {/* Values */}
          {tone.length > 0 && (
            <div className="flex flex-col">
              <div className="flex flex-wrap gap-1 mt-1">
                {tone.map((tone, index) => (
                  <Badge
                    key={index}
                    variant={"outline"}
                    className="text-xs bg-purple-50 text-purple-700 border-purple-100"
                  >
                    {tone}
                  </Badge>
                ))}
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
