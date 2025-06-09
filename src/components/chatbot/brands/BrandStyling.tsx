import { ContentSection } from "@/components/shared/ContentSection";
import { InlineEditableField } from "@/components/shared/InlineEditableField";
import { formatUpdateMessage } from "@/lib/langgraph.utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { Agents } from "@/types/types";

interface StylingProps {
  tone?: string;
  mobility?: string;
  textures?: string;
}

export const BrandStyling = (props: StylingProps) => {
  const hasContent = Object.values(props).some(Boolean);
  if (!hasContent) return null;

  const stream = useStreamContext();

  return (
    <ContentSection
      title="Styling"
      content={
        <div className="space-y-4">
          {Object.entries(props).map(
            ([key, value]) =>
              value && (
                <div key={key}>
                  <h4 className="font-medium text-sm capitalize">
                    {key.replace(/_/g, " ")}
                  </h4>
                  <InlineEditableField
                    label={key}
                    value={value}
                    onSave={async (newVal) => {
                      const oldVal = value;
                      const msg = formatUpdateMessage(
                        `static.brand.styling.${key}`,
                        oldVal,
                        newVal,
                        "brandingAgent",
                        key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase()) // Title Case
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
              )
          )}
        </div>
      }
      context={{
        agentId: Agents.BRANDING_AGENT,
        data: props,
      }}
    />
  );
};
