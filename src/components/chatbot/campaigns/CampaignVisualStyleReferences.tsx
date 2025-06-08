import { ContentSection } from "@/components/shared/ContentSection";
import { ImageModal } from "@/components/shared/ImageModal";
import { Badge } from "@/components/ui/badge";
import { Agents, ThreadCampaign } from "@/types/types";
import React from "react";

const CampaignVisualStyleReferences = ({
  visualStyleReferences,
}: {
  visualStyleReferences: ThreadCampaign["visual_style_references"];
}) => {
  const [expandedImage, setExpandedImage] = React.useState<string | null>(null);

  if (
    !visualStyleReferences ||
    !visualStyleReferences.images ||
    visualStyleReferences.images.length === 0
  ) {
    return (
      <ContentSection
        title={`Visual Style References`}
        content={
          <p className="text-gray-500 text-sm">
            No visual style references available. Please add some visual style
            images to the campaign to see them here.
          </p>
        }
      />
    );
  }

  return (
    <ContentSection
      title={`Visual Style References`}
      content={
        <div className="space-y-3">
          <div className="grid grid-cols-4">
            {visualStyleReferences.images.map((image, index) => (
              <div
                key={index}
                className="w-full h-64"
                onClick={() => setExpandedImage(image)}
              >
                <img src={image} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          {Object.entries(visualStyleReferences.analysis ?? {}).map(
            ([key, value]) => (
              <ContentSection
                showCopy={false}
                showPin={false}
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
          {expandedImage && (
            <ImageModal
              imageUrl={expandedImage}
              onClose={() => setExpandedImage(null)}
              isOpen={!!expandedImage}
            />
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
