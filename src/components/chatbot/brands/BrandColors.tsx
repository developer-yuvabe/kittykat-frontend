import { ContentSection } from "@/components/shared/ContentSection";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import {
  filterAndNormalizeColors,
  getFontColorForBackground,
} from "@/lib/langgraph.utils";
import { Color } from "@/types/langgraph.types";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import React from "react";

interface BrandColorsProps {
  colors: Color[];
}

export const BrandColors: React.FC<BrandColorsProps> = ({ colors }) => {
  const validColors = filterAndNormalizeColors(colors);
  const [copied, setCopied] = useState<number | null>(null);

  // Skip rendering if no valid colors
  if (validColors.length === 0) return null;

  const copyToClipboard = (colorHex: string, idx: number) => {
    try {
      navigator.clipboard.writeText(colorHex);
      setCopied(idx);

      toast.success(`Color ${colorHex} copied to clipboard!`, {
        position: "top-right",
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {}
  };

  return (
    <ContentSection
      title="Brand Colors"
      content={
        <div className="flex flex-wrap gap-4">
          {validColors.map((color, idx) => (
            <div key={idx} className="relative group">
              <div
                className="h-24 w-24 rounded shadow-md transition-transform duration-200 group-hover:scale-95"
                style={{ backgroundColor: color.hex }}
              >
                {/* Copy Button */}
                <TooltipIconButton
                  tooltip="Copy color"
                  side="top"
                  onClick={() => copyToClipboard(color.hex, idx)}
                  className="absolute -top-3 -right-3 bg-white p-1 rounded-full shadow hover:bg-gray-100 z-10"
                >
                  {copied == idx ? <Check size={16} /> : <Copy size={16} />}
                </TooltipIconButton>

                {/* Color Info on Hover */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-transparent bg-opacity-40 transition-opacity rounded text-center`}
                  style={{ color: getFontColorForBackground(color.hex) }}
                >
                  <div className="font-light text-[12px] text-center">
                    {color.name}
                  </div>
                  <div className="text-base text-[10px] ">{color.hex}</div>
                  {color.label && (
                    <div className="text-[8px] mt-1 text-center">
                      {color.label}
                    </div>
                  )}
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
