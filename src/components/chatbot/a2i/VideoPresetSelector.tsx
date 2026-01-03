"use client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import { VideoPreset, VIDEO_PRESETS } from "@/types/a2i-video.types";
import { VideoPresetIcon } from "@/components/ui/custom-icon";
import { useState } from "react";

interface VideoPresetSelectorProps {
  value?: VideoPreset | null;
  onChange: (preset: VideoPreset | null) => void;
}

export function VideoPresetSelector({
  // presets,
  value,
  onChange,
}: VideoPresetSelectorProps) {
  const presets = VIDEO_PRESETS;
  const [open, setOpen] = useState(false);
  return (
    <Select open={open} onOpenChange={setOpen} value={value?.id ?? ""}>
      <SelectTrigger className="w-full gap-2">
        {value ? (
          <div className="flex items-center gap-2">
            <VideoPresetIcon className="text-primary" />
            <span className="text-sm">{value.name}</span>
          </div>
        ) : (
          <div className="flex justify-center items-center gap-2">
            <VideoPresetIcon className="text-black" />
            <SelectValue placeholder="Select Preset" />
          </div>
        )}
      </SelectTrigger>

      <SelectContent className="w-[1300px] p-3" align="start">
        <div className="grid grid-cols-7 gap-3">
          {presets.map((preset) => {
            const selected = value?.id === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  if (selected) {
                    onChange(null);
                  } else {
                    onChange(preset);
                  }
                  setOpen(false);
                }}
                className={cn(
                  "relative h-[175px] w-[175px] rounded-lg border p-3 text-left transition",
                  "hover:bg-muted",
                  selected ? "border-primary bg-primary/5" : "border-muted"
                )}
              >
                {selected && (
                  <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />
                )}

                <div className="space-y-1">
                  <div className="text-sm font-medium">{preset.name}</div>

                  <div className="text-xs text-muted-foreground leading-snug">
                    {preset.description}
                  </div>

                  {preset.isMultiShot && (
                    <div className="mt-2 inline-flex rounded bg-muted px-2 py-0.5 text-[11px] font-medium">
                      {preset.shotCount}-Shot Story
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </SelectContent>
    </Select>
  );
}
