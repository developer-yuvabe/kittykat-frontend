import { ContentSection } from "@/components/shared/ContentSection";
import { Agents } from "@/types/types";

interface StylingProps {
  tone?: string;
  mobility?: string;
  textures?: string;
}

export const BrandStyling = (props: StylingProps) => {
  const hasContent = Object.values(props).some(Boolean);
  if (!hasContent) return null;

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
                  <p className="text-sm text-gray-700">{value}</p>
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
