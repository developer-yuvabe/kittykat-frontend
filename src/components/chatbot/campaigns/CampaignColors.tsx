import { ContentSection } from "@/components/shared/ContentSection";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { getFontColorForBackground } from "@/lib/langgraph.utils";
import { toast } from "sonner";
import React from "react";
import { Copy } from "lucide-react";

interface CampaignColorsProps {
  colors: string[];
}

export const CampaignColors: React.FC<CampaignColorsProps> = ({ colors }) => {
  // Filter valid colors
  const validColors = colors.filter((color) => /^#[0-9A-Fa-f]{6}$/.test(color));

  // Skip rendering if no valid colors
  if (validColors.length === 0) return null;

  const copyToClipboard = (colorHex: string) => {
    navigator.clipboard.writeText(colorHex);

    toast.success(`Color ${colorHex} copied to clipboard!`, {
      position: "top-right",
    });
  };

  return (
    <ContentSection
      title="Campaign Colors"
      content={
        <div className="flex flex-wrap gap-4">
          {validColors.map((color, idx) => (
            <div key={idx} className="relative group">
              <div
                className="h-24 w-24 rounded shadow-md transition-transform duration-200 group-hover:scale-95"
                style={{ backgroundColor: color }}
              >
                {/* Copy Button */}
                <TooltipIconButton
                  tooltip="Copy color"
                  side="top"
                  onClick={() => copyToClipboard(color)}
                  className="absolute -top-3 -right-3 bg-white p-1 rounded-full shadow hover:bg-gray-100 z-10"
                >
                  <Copy size={16} />
                </TooltipIconButton>

                {/* Color Info on Hover */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-transparent bg-opacity-40 transition-opacity rounded`}
                  style={{ color: getFontColorForBackground(color) }}
                >
                  <div className="text-base text-[10px]">{color}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
      context={{ colors }}
    />
  );
};
