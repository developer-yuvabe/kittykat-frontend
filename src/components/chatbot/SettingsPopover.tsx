"use client";
import React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getShowboardConfig,
  updateShowboardConfig,
} from "@/services/api/langgraph.service";

export function SettingsPopover() {
  const [settings, setSettings] = useState({
    imageModel: "",
    textModel: "",
  });

  const [tempSettings, setTempSettings] = useState({
    imageModel: "",
    textModel: "",
  });

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const config = await getShowboardConfig();
        const newSettings = {
          imageModel: config.model,
          textModel: config.text_model,
        };
        setSettings(newSettings);
        setTempSettings(newSettings);
      } catch (error) {
        console.error("Error fetching showboard config:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleCancel = () => {
    setTempSettings({ ...settings });
    setOpen(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateShowboardConfig(
        4,
        tempSettings.imageModel,
        tempSettings.textModel
      );

      setSettings({ ...tempSettings });
      setOpen(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  interface SettingsState {
    imageModel: string;
    textModel: string;
  }

  interface HandleModelChange {
    (key: keyof SettingsState, value: string): void;
  }

  const handleModelChange: HandleModelChange = (key, value) => {
    setTempSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Settings size={20} className="z-40 cursor-pointer" />
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Configure the image</p>
            <p>and text models.</p>
          </TooltipContent>
        </Tooltip>

        <PopoverContent className="w-64 p-4 space-y-4">
          {/* Image Model */}
          {/* <div>
            <h4 className="mb-1 text-sm font-semibold">
              Image Generation Model
            </h4>
            {isLoading ? (
              <Skeleton className="w-full h-10 rounded-md" />
            ) : (
              <Select
                value={tempSettings.imageModel}
                onValueChange={(value) =>
                  handleModelChange("imageModel", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="black-forest-labs/flux-dev">
                    Flux Dev
                  </SelectItem>
                  <SelectItem value="black-forest-labs/flux-schnell">
                    Flux Schnell
                  </SelectItem>
                  <SelectItem value="black-forest-labs/flux-1.1-pro">
                    Flux Pro
                  </SelectItem>
                  <SelectItem value="dall-e-3">DALL·E 3</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div> */}

          {/* Text Model */}
          <div>
            <h4 className="mb-1 text-sm font-semibold">
              Text Generation Model
            </h4>
            {isLoading ? (
              <Skeleton className="w-full h-10 rounded-md" />
            ) : (
              <Select
                value={tempSettings.textModel}
                onValueChange={(value) => handleModelChange("textModel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                  <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                  <SelectItem value="gpt-4.1">gpt-4.1</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-2 space-x-2">
            {isLoading ? (
              <>
                <Skeleton className="w-16 rounded-md h-9" />
                <Skeleton className="w-16 rounded-md h-9" />
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
