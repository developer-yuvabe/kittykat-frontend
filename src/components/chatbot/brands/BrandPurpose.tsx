import { ContentSection } from "@/components/shared/ContentSection";
import { Agents } from "@/types/types";
import React from "react";

interface BrandPurposeProps {
  mission?: string;
  vision?: string;
}

const BrandPurpose = ({ mission, vision }: BrandPurposeProps) => {
  if (!mission && !vision) return null;

  return (
    <ContentSection
      title="Brand Purpose"
      content={
        <div className="space-y-4">
          {mission && (
            <div>
              <h4 className="font-medium text-sm">Mission</h4>
              <p className="text-sm text-gray-700">{mission}</p>
            </div>
          )}
          {vision && (
            <div>
              <h4 className="font-medium text-sm">Vision</h4>
              <p className="text-sm text-gray-700">{vision}</p>
            </div>
          )}
        </div>
      }
      context={{
        agentId: Agents.BRANDING_AGENT,
        data: {
          mission,
          vision,
        },
      }}
    />
  );
};

export default BrandPurpose;
