import { ContentSection } from "@/components/shared/ContentSection";
import { Badge } from "@/components/ui/badge";
import { Agents } from "@/types/types";
import React from "react";

interface BrandOverviewProps {
  tagline?: string;
  values?: string[];
  name?: string;
}

export const BrandOverview: React.FC<BrandOverviewProps> = ({
  tagline,
  values,
  name,
}) => {
  return (
    <ContentSection
      title="Brand Overview"
      content={
        <div className="space-y-3">
          {/* Tagline */}
          {tagline && (
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">{tagline}</span>
            </div>
          )}

          {/* Values */}
          {values && values.length > 0 && (
            <div className="flex flex-col">
              <div className="flex flex-wrap gap-1 mt-1">
                {values.map((value, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs bg-purple-50 text-purple-700 border-purple-100"
                  >
                    {value}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      }
      context={{
        agentId: Agents.BRANDING_AGENT,
        data: {
          tagline,
          values,
          name,
        },
      }}
    />
  );
};
