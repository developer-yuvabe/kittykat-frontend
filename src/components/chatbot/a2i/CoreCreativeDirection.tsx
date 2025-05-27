// components/CoreCreativeDirection.tsx

import { ContentSection } from "@/components/shared/ContentSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CoreCreativeDirectionProps = {
  stylePreset: string;
  setStylePreset: (value: string) => void;
};

const STYLE_PRESETS = [
  { label: "Campaign Moodboard Match", value: "moodboard" },
  { label: "Virtual Try On", value: "vto" },
  { label: "PDP Shoot", value: "pdp" },
  { label: "Custom Preset Birkenstock Catalog", value: "birkenstock-catalog" },
  { label: "Custom", value: "custom" },
];

export const CoreCreativeDirection = ({
  stylePreset,
  setStylePreset,
}: CoreCreativeDirectionProps) => {
  return (
    <ContentSection
      title="Core Creative Direction"
      content={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Style Pre-Set
            </label>
            <Select value={stylePreset} onValueChange={setStylePreset}>
              <SelectTrigger>
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                {STYLE_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      }
    />
  );
};
