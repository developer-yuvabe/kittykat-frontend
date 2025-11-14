import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import React from "react";

interface A2iAdvancedPromptPresetSelectorProps {
  selectedPreset: string;
  onPresetChange: (presetId: string) => void;
  disabled?: boolean;
}

// Master preset configuration
export const MASTER_PRESET_ID = "691316d8eaf49d349db074a5";
export const MASTER_PRESET_LABEL = "Master Preset";

const PRESETS = [
  { id: MASTER_PRESET_ID, label: MASTER_PRESET_LABEL },
  // Add more presets here as needed
];

export const A2iAdvancedPromptPresetSelector: React.FC<
  A2iAdvancedPromptPresetSelectorProps
> = ({ selectedPreset, onPresetChange, disabled = false }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Preset</span>
      <Select
        value={selectedPreset}
        onValueChange={onPresetChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Select preset..." />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
