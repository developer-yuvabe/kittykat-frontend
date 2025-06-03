import { ContentSection } from "@/components/shared/ContentSection";
import { InlineEditableField } from "@/components/shared/InlineEditableField";
import { formatUpdateMessage } from "@/lib/langgraph.utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { Agents } from "@/types/types";
import React from "react";

interface BrandPurposeProps {
  mission?: string;
  vision?: string;
}

const BrandPurpose = ({ mission, vision }: BrandPurposeProps) => {
  if (!mission && !vision) return null;
  const stream = useStreamContext();

  return (
    <ContentSection
      title="Brand Purpose"
      content={
        <div className="space-y-4">
          {mission && (
            <div>
              <h4 className="font-medium text-sm">Mission</h4>
              <InlineEditableField
                key={mission}
                label="Mission"
                value={mission || ""}
                onSave={async (newVal) => {
                  const oldVal = mission || "";
                  const msg = formatUpdateMessage(
                    "static.brand.mission",
                    oldVal,
                    newVal,
                    "brandingAgent",
                    "Brand Mission",
                    `Update the value of the "mission" field to the following user-provided text:\n"${newVal}".`
                  );
                  if (msg) {
                    submitOptimisticMessage({
                      stream,
                      text: msg,
                    });
                  }
                }}
                textClassName="text-sm text-gray-700"
                isTextarea={true}
              />
            </div>
          )}
          {vision && (
            <div>
              <h4 className="font-medium text-sm">Vision</h4>
              <InlineEditableField
                key={vision}
                label="Vision"
                value={vision || ""}
                onSave={async (newVal) => {
                  const oldVal = vision || "";
                  const msg = formatUpdateMessage(
                    "brand.vision",
                    oldVal,
                    newVal,
                    "brandingAgent",
                    "Brand Vision"
                  );
                  if (msg) {
                    submitOptimisticMessage({
                      stream,
                      text: msg,
                    });
                  }
                }}
                textClassName="text-sm text-gray-700"
                isTextarea={true}
              />
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
