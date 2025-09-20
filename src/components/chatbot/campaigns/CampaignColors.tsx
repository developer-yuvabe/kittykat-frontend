import { ContentSection } from "@/components/shared/ContentSection";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getFontColorForBackground,
  formatUpdateArrayMessage,
} from "@/lib/langgraph.utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { toast } from "sonner";
import React, { useState } from "react";
import { Check, Copy, Pencil } from "lucide-react";
import { Agents } from "@/types/types";
import { useUserStore } from "@/store/user.store";
import { useBrandStore } from "@/store/brand.store";
interface CampaignColorsProps {
  colors: string[];
  campaignId: string;
  campaignTitle: string | undefined;
}

export const CampaignColors: React.FC<CampaignColorsProps> = ({
  colors,
  campaignId,
  campaignTitle,
}) => {
  const [copied, setCopied] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newColor, setNewColor] = useState<string>("");
  const [popoverOpen, setPopoverOpen] = useState<number | null>(null);
  const stream = useStreamContext();
  const { user } = useUserStore();
  const { selectedBrandId } = useBrandStore();
  const [validColors, setValidColors] = useState(
    colors.filter((color) => /^#[0-9A-Fa-f]{6}$/.test(color))
  );
  if (validColors.length === 0) return null;

  const handleEditClick = (idx: number) => {
    setEditingIndex(idx);
    setNewColor(validColors[idx]);
    setPopoverOpen(idx);
  };

  const copyToClipboard = (colorHex: string, idx: number) => {
    navigator.clipboard.writeText(colorHex);
    setCopied(idx);
    toast.success(`Color ${colorHex} copied!`, { position: "top-right" });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = async () => {
    if (editingIndex === null || !/^#[0-9A-Fa-f]{6}$/.test(newColor)) return;

    const oldColor = validColors[editingIndex];
    if (oldColor === newColor) {
      setPopoverOpen(null);
      return;
    }

    const newColorArray = [...validColors];
    newColorArray[editingIndex] = newColor;

    setValidColors(newColorArray);

    const msg = formatUpdateArrayMessage(
      "colors",
      validColors,
      newColorArray,
      "campaignAgent",
      "Campaign Colors",
      `Change my ${campaignTitle}'s color at index ${editingIndex} from ${oldColor} to ${newColor} (campaignId: ${campaignId})`
    );

    if (msg) {
      submitOptimisticMessage({
        stream,
        text: msg,

        userId: user!.id,
        currentBrandContextId: selectedBrandId,
      });
    }

    setPopoverOpen(null);
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
                <TooltipIconButton
                  tooltip="Copy color"
                  side="top"
                  onClick={() => copyToClipboard(color, idx)}
                  className="absolute -top-3 -right-3 bg-white p-1 rounded-full shadow hover:bg-gray-100 z-10"
                >
                  {copied == idx ? <Check size={16} /> : <Copy size={16} />}
                </TooltipIconButton>

                {/* Edit Button */}
                <Popover
                  open={popoverOpen === idx}
                  onOpenChange={(open) => setPopoverOpen(open ? idx : null)}
                >
                  <PopoverTrigger asChild>
                    <TooltipIconButton
                      tooltip="Edit color"
                      side="top"
                      onClick={() => handleEditClick(idx)}
                      className="absolute -top-3 right-4 bg-white p-1 rounded-full shadow hover:bg-gray-100 z-10 opacity-0 group-hover:opacity-100"
                    >
                      <Pencil size={16} />
                    </TooltipIconButton>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4" side="top">
                    <div className="space-y-3">
                      <Input
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        placeholder="#FF0000"
                        className="font-mono"
                      />
                      {!/^#[0-9A-Fa-f]{6}$/.test(newColor) && (
                        <p className="text-sm text-red-500">
                          Invalid hex color
                        </p>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleSave}
                          disabled={!/^#[0-9A-Fa-f]{6}$/.test(newColor)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setPopoverOpen(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Color info */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center text-center"
                  style={{ color: getFontColorForBackground(color) }}
                >
                  <div className="text-xs">{color}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
      context={{
        agentId: Agents.CAMPAIGN_AGENT,
        data: { colors },
      }}
    />
  );
};
