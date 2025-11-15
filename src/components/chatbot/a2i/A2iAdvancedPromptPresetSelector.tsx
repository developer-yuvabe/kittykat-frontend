import { useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useBrandStore } from "@/store/brand.store";
import { usePresets } from "@/hooks/usePresets";
import React from "react";

interface A2iAdvancedPromptPresetSelectorProps {
  selectedPreset: string | undefined;
  onPresetChange: (presetId: string) => void;
  disabled?: boolean;
}

export const A2iAdvancedPromptPresetSelector: React.FC<
  A2iAdvancedPromptPresetSelectorProps
> = ({ selectedPreset, onPresetChange, disabled = false }) => {
  const { selectedBrandId } = useBrandStore();

  const { presetsForBrandQuery } = usePresets({
    brandId: selectedBrandId || undefined,
    enabled: !!selectedBrandId,
  });

  const { data: presetsData, isLoading, error } = presetsForBrandQuery;

  const presets = presetsData?.presets || [];

  // Auto-select master preset or first preset when presets are loaded and no preset is selected
  useEffect(() => {
    // Only auto-select if:
    // 1. Presets are loaded (not loading and has items)
    // 2. No preset is currently selected OR selected preset doesn't exist in the list
    if (isLoading || presets.length === 0) return;

    const isValidSelection =
      selectedPreset && presets.find((p) => p.id === selectedPreset);

    if (!isValidSelection) {
      // Find master preset first, otherwise use the first preset
      const masterPreset = presets.find((preset) => preset.is_master);
      const presetToSelect = masterPreset || presets[0];

      if (presetToSelect && presetToSelect.id) {
        onPresetChange(presetToSelect.id);
      } else {
        console.error(
          "[PresetSelector] Cannot auto-select - preset has no ID:",
          presetToSelect
        );
      }
    }
  }, [presets, isLoading, selectedPreset, onPresetChange]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Preset</span>
      <Select
        value={selectedPreset || ""}
        onValueChange={onPresetChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-56">
          <SelectValue
            placeholder={isLoading ? "Loading presets..." : "Select preset..."}
            className="font-bold text-black"
          />
        </SelectTrigger>
        <SelectContent>
          {error && (
            <SelectItem value="" disabled>
              Error loading presets
            </SelectItem>
          )}
          {presets.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              {preset.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
