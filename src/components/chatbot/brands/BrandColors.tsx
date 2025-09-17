import { ContentSection } from "@/components/shared/ContentSection";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  filterAndNormalizeColors,
  getFontColorForBackground,
  formatUpdateMessage,
} from "@/lib/langgraph.utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { Color } from "@/types/langgraph.types";
import { Check, Copy, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import React from "react";
import { Agents } from "@/types/types";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";

interface BrandColorsProps {
  colors: Color[];
}

interface ColorEditForm {
  name: string;
  hex: string;
}

export const BrandColors: React.FC<BrandColorsProps> = ({ colors }) => {
  const [validColors, setValidColors] = useState(
    filterAndNormalizeColors(colors)
  );
  const [copied, setCopied] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ColorEditForm>({
    name: "",
    hex: "",
  });
  const [popoverOpen, setPopoverOpen] = useState<number | null>(null);
  const { user } = useUserStore();
  const { selectedBrandId } = useBrandStore();

  const stream = useStreamContext();

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
    } catch (error) {
      console.error("Failed to copy color:", error);
    }
  };

  const handleEditClick = (index: number) => {
    const color = validColors[index];
    setEditForm({
      name: color.name || `Color ${index + 1}`,
      hex: color.hex,
    });
    setEditingIndex(index);
    setPopoverOpen(index);
  };

  const handleSave = async () => {
    if (editingIndex === null) return;

    const originalColor = validColors[editingIndex];
    const hasChanges =
      editForm.name !== (originalColor.name || `Color ${editingIndex + 1}`) ||
      editForm.hex !== originalColor.hex ||
      "";

    if (!hasChanges) {
      setPopoverOpen(null);
      return;
    }

    try {
      // Determine the color's role/type for better messaging
      const colorRole =
        originalColor.label ||
        originalColor.name ||
        `Color ${editingIndex + 1}`;

      // Create a simple, direct message
      const changeMessage = `Change my ${colorRole} to ${editForm.name} (${editForm.hex}).`;

      // Format the update message with minimal technical details
      const fieldPath = `static.brand.colors[${editingIndex}]`;
      const originalColorString = `${
        originalColor.name || `Color ${editingIndex + 1}`
      } (${originalColor.hex})`;
      const newColorString = `${editForm.name} (${editForm.hex})`;

      const msg = formatUpdateMessage(
        fieldPath,
        originalColorString,
        newColorString,
        "brandingAgent",
        colorRole,
        changeMessage
      );

      if (msg) {
        // Replace the action with our simple message and add minimal context
        const enhancedMsg = msg
          .replace(/Action: .*\n/, `Action: ${changeMessage}\n`)
          .replace(
            "</kittykat-do-not-render>",
            `Original: ${originalColorString}
            New: ${newColorString}
            Index: ${editingIndex}
            </kittykat-do-not-render>`
          );

        submitOptimisticMessage({
          stream,
          text: enhancedMsg,
          userId: user!.id,
          currentBrandContextId: selectedBrandId,
        });
      }

      // Update local state immediately for responsiveness
      const updatedColors = [...validColors];
      updatedColors[editingIndex] = {
        name: editForm.name,
        hex: editForm.hex,
        label: originalColor.label,
      };

      setValidColors(updatedColors);
      setPopoverOpen(null);
      setEditingIndex(null);
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const isValidHexColor = (hex: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
  };

  const handleFormChange = (field: keyof ColorEditForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
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
                      className="absolute -top-3 right-4 bg-white p-1 rounded-full shadow hover:bg-gray-100 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil size={16} />
                    </TooltipIconButton>
                  </PopoverTrigger>

                  <PopoverContent className="w-80 p-4" side="top">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: editForm.hex }}
                        />
                        <h4 className="font-medium">Edit Color</h4>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label
                            htmlFor="color-name"
                            className="text-sm font-medium"
                          >
                            Name
                          </Label>
                          <Input
                            id="color-name"
                            value={editForm.name}
                            onChange={(e) =>
                              handleFormChange("name", e.target.value)
                            }
                            placeholder="Primary Blue"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="color-hex"
                            className="text-sm font-medium"
                          >
                            Hex Code
                          </Label>
                          <Input
                            id="color-hex"
                            value={editForm.hex}
                            onChange={(e) =>
                              handleFormChange("hex", e.target.value)
                            }
                            placeholder="#0066CC"
                            className="mt-1 font-mono"
                          />
                          {editForm.hex && !isValidHexColor(editForm.hex) && (
                            <p className="text-sm text-red-500 mt-1">
                              Please enter a valid hex color (e.g., #0066CC)
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleSave}
                          disabled={
                            !isValidHexColor(editForm.hex) ||
                            !editForm.name.trim()
                          }
                          className="flex-1"
                        >
                          {"Save Changes"}
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

                {/* Color Info Display */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center bg-transparent transition-opacity rounded text-center p-1"
                  style={{ color: getFontColorForBackground(color.hex) }}
                >
                  <div className="font-light text-[12px] text-center">
                    {color.name || `Color ${idx + 1}`}
                  </div>
                  <div className="text-[10px]">{color.hex}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
      context={{
        agentId: Agents.BRANDING_AGENT,
        data: { colors },
      }}
    />
  );
};
