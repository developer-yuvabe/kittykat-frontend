import { ContentSection } from "@/components/shared/ContentSection";
import { InlineEditableField } from "@/components/shared/InlineEditableField";
import { InlineEditableBadges } from "@/components/shared/InlineEditableBadges";
import {
  formatUpdateMessage,
  formatUpdateArrayMessage,
} from "@/lib/langgraph.utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { Agents } from "@/types/types";
import React from "react";
import { useUserStore } from "@/store/user.store";
import { useBrandStore } from "@/store/brand.store";

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
  const stream = useStreamContext();
  const { user } = useUserStore();
  const { selectedBrandId } = useBrandStore();
  return (
    <ContentSection
      title="Brand Overview"
      content={
        <div className="space-y-3">
          {/* Tagline */}
          {tagline && (
            <div className="flex flex-col">
              <InlineEditableField
                key={tagline}
                label="Tagline"
                value={tagline || ""}
                onSave={async (newVal) => {
                  const oldVal = tagline || "";
                  const msg = formatUpdateMessage(
                    "static.brand.tagline",
                    oldVal,
                    newVal,
                    "brandingAgent",
                    "Brand Tagline"
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
          )}

          {/* Values */}
          {values && values.length > 0 && (
            <div className="flex flex-col">
              <InlineEditableBadges
                label="Values"
                values={values}
                onSave={async (newValues) => {
                  const msg = formatUpdateArrayMessage(
                    "static.brand.values",
                    values,
                    newValues,
                    "brandingAgent",
                    "Brand Values"
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
                showLabel={false}
              />
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
