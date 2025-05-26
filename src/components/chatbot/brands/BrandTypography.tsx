import { ContentSection } from "@/components/shared/ContentSection";
import { Badge } from "@/components/ui/badge";
import { Agents } from "@/types/types";
import React from "react";

interface FontDetails {
  name: string;
  weights?: any[];
}

interface TypographyProps {
  primaryFont?: FontDetails;
  secondaryFont?: FontDetails;
}

export const BrandTypography: React.FC<TypographyProps> = ({
  primaryFont,
  secondaryFont,
}) => {
  // Helper to check if a font is valid (name is required, weights are optional)
  const isValidFont = (font?: FontDetails) => {
    return font?.name?.trim();
  };

  // Filter out invalid fonts
  const validPrimaryFont = isValidFont(primaryFont) ? primaryFont : undefined;
  const validSecondaryFont = isValidFont(secondaryFont)
    ? secondaryFont
    : undefined;

  // Skip rendering if no valid fonts are present
  if (!validPrimaryFont && !validSecondaryFont) return null;

  const renderFontDetails = (label: string, font: FontDetails) => (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{label}</div>
      <div className="ml-2 space-y-1">
        <div className="text-sm text-gray-700">{font.name}</div>
        {font.weights && font.weights.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {font.weights
              .filter(
                (weight) =>
                  weight !== undefined &&
                  weight !== null &&
                  String(weight).trim()
              )
              .map((weight, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs bg-gray-50 text-gray-700 border-gray-200"
                >
                  {String(weight)}
                </Badge>
              ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ContentSection
      title="Brand Typography"
      content={
        <div className="space-y-4">
          {validPrimaryFont &&
            renderFontDetails("Primary Font", validPrimaryFont)}
          {validSecondaryFont &&
            renderFontDetails("Secondary Font", validSecondaryFont)}
        </div>
      }
      context={{
        agentId: Agents.BRANDING_AGENT,
        data: {
          primaryFont,
          secondaryFont,
        },
      }}
    />
  );
};
