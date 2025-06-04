import { ContentSection } from "@/components/shared/ContentSection";
import { Badge } from "@/components/ui/badge";
import { Agents, ThreadCampaign } from "@/types/types";
import React from "react";

const CampaignVisualStyleReferences = ({
  visualStyleReferences,
}: {
  visualStyleReferences: ThreadCampaign["visual_style_references"];
}) => {
  if (
    !visualStyleReferences ||
    !visualStyleReferences.images ||
    visualStyleReferences.images.length === 0
  ) {
    return null;
  }

  return (
    <ContentSection
      title={`Visual Style References`}
      content={
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visualStyleReferences.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Visual Style Reference ${index + 1}`}
                className="w-full h-auto object-cover"
              />
            ))}
          </div>
          {Object.entries(visualStyleReferences.analysis ?? {}).map(
            ([key, value]) => (
              <ContentSection
                key={key}
                title={`${key.charAt(0).toUpperCase() + key.slice(1)}`}
                content={
                  <div className="flex flex-wrap gap-4">
                    {value.map((item) => (
                      <Badge
                        key={item.tag}
                        className="text-xs bg-gray-50 text-gray-700 border-gray-200 capitalize"
                      >
                        {item.tag}
                      </Badge>
                    ))}
                  </div>
                }
                context={{
                  agentId: Agents.CAMPAIGN_AGENT,
                  data: value,
                }}
              />
            )
          )}
        </div>
      }
      context={{
        agentId: Agents.CAMPAIGN_AGENT,
        data: {
          analysis: visualStyleReferences.analysis,
        },
      }}
    />
  );
};

export default CampaignVisualStyleReferences;
