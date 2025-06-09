import { ContentSection } from "@/components/shared/ContentSection";
import { InlineEditableField } from "@/components/shared/InlineEditableField";
import { formatUpdateMessage } from "@/lib/langgraph.utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { Agents } from "@/types/types";

interface CastingProps {
  diversity_policy?: string;
  persona?: string;
  variation?: string;
}

export const BrandCasting = (props: CastingProps) => {
  const hasContent = Object.values(props).some(Boolean);
  if (!hasContent) return null;

  const stream = useStreamContext();
  const { user } = useUserStore();
  const { selectedBrandId } = useBrandStore();

  return (
    <ContentSection
      title="Casting"
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
                        `static.brand.casting.${key}`,
                        oldVal,
                        newVal,
                        "brandingAgent",
                        key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase()),
                        `Please update the "${key.replace(
                          /_/g,
                          " "
                        )}" to better reflect the brand's current casting preferences. Ensure this change aligns with the diversity and persona guidelines provided.`
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
