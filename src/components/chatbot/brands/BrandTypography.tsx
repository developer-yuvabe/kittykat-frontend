import React, { useState } from "react";
import { ContentSection } from "@/components/shared/ContentSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Pencil } from "lucide-react";
import { Agents } from "@/types/types";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { useStreamContext } from "@/providers/langgraph/Stream";

interface FontDetails {
  name?: string;
  weights?: string[];
}

interface TypographyProps {
  primaryFont?: FontDetails;
  secondaryFont?: FontDetails;
}

export const BrandTypography: React.FC<TypographyProps> = ({
  primaryFont,
  secondaryFont,
}) => {
  const stream = useStreamContext();
  const [editingFontKey, setEditingFontKey] = useState<
    "primary" | "secondary" | null
  >(null);
  const [formState, setFormState] = useState<FontDetails>({
    name: "",
    weights: [],
  });

  const handleEditClick = (key: "primary" | "secondary", font: FontDetails) => {
    setFormState({
      name: font.name || "",
      weights: font.weights || [],
    });
    setEditingFontKey(key);
  };

  const handleSave = () => {
    const message = `Change my ${editingFontKey} font to ${formState.name}${
      formState.weights?.length
        ? ` with weights ${formState.weights.join(", ")}`
        : ""
    }.
</kittykat-do-not-render>
You must use brandingAgent to update font.
FontKey: ${editingFontKey}
FontName: ${formState.name}
FontWeights: ${formState.weights?.join(", ") || ""}
</kittykat-do-not-render>`;

    submitOptimisticMessage({
      stream,
      text: message,
    });

    setEditingFontKey(null);
  };

  const isValidFont = (font?: FontDetails) => font?.name?.trim();

  const renderFontDetails = (
    label: string,
    font: FontDetails,
    key: "primary" | "secondary"
  ) => {
    const isEditing = editingFontKey === key;

    return (
      <div className="space-y-2 relative group  rounded p-3">
        <div className="text-sm font-medium flex items-center gap-2">
          {label}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3 z-10">
            <Popover
              open={isEditing}
              onOpenChange={(open) => setEditingFontKey(open ? key : null)}
            >
              <PopoverTrigger asChild>
                <TooltipIconButton
                  tooltip="Edit font"
                  side="top"
                  onClick={() => handleEditClick(key, font)}
                >
                  <Pencil size={14} />
                </TooltipIconButton>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4 space-y-3">
                <div>
                  <label className="text-sm font-medium">Font Name</label>
                  <Input
                    className="mt-1"
                    value={formState.name}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Roboto"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Weights (comma-separated)
                  </label>
                  <Input
                    className="mt-1"
                    value={formState.weights?.join(", ")}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        weights: e.target.value.split(",").map((w) => w.trim()),
                      }))
                    }
                    placeholder="400, 700"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={!(formState.name ?? "").trim()}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingFontKey(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm text-gray-700">{font.name}</div>
          {font.weights && font.weights.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {font.weights
                .filter((w) => String(w).trim())
                .map((weight, i) => (
                  <Badge
                    key={i}
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
  };

  const validPrimaryFont = isValidFont(primaryFont) ? primaryFont : undefined;
  const validSecondaryFont = isValidFont(secondaryFont)
    ? secondaryFont
    : undefined;

  if (!validPrimaryFont && !validSecondaryFont) return null;

  return (
    <ContentSection
      title="Brand Typography"
      content={
        <div className="space-y-2">
          {validPrimaryFont &&
            renderFontDetails("Primary Font", validPrimaryFont, "primary")}
          {validSecondaryFont &&
            renderFontDetails(
              "Secondary Font",
              validSecondaryFont,
              "secondary"
            )}
        </div>
      }
      context={{
        agentId: Agents.BRANDING_AGENT,
        data: { primaryFont, secondaryFont },
      }}
    />
  );
};
