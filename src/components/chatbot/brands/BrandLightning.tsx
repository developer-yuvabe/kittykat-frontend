import { ContentSection } from "@/components/shared/ContentSection";
import { Agents } from "@/types/types";

interface LightingProps {
  type?: string;
  studio_usage?: string;
  preferred_moods?: string;
}

export const BrandLighting = (props: LightingProps) => {
  const hasContent = Object.values(props).some(Boolean);
  if (!hasContent) return null;

  return (
    <ContentSection
      title="Lighting"
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
