"use client";

import { patchMoodboard } from "@/services/api/moodboard.service";
import EditableInput from "./EditableInput";
import MoodboardSaveIndicator from "./MoodboardSaveIndicator";
import MoodboardControls from "./MoodboardControls";
import { Button } from "@/components/ui/button";
import { LoaderCircle, SparklesIcon } from "lucide-react";
import type { Photo } from "react-photo-album";
import { SortablePhoto } from "@/components/gallery/CustomGalleryContainer";
import type { MoodboardInformation } from "@/types/types";
import { useStreamContext } from "@/providers/langgraph/Stream";

interface MoodboardHeaderProps {
  moodboard: MoodboardInformation;
  brandId: string;
  isMoodboardSaving: boolean;
  hasUnsavedChanges: boolean;
  photos: SortablePhoto<Photo>[];
  isAutoFillLoading: boolean;
  autoFillPlaceholders: () => void;
  onPinMoodboard?: () => void;
  isScreenshotLoading: boolean;
}

function MoodboardHeader({
  moodboard,
  brandId,
  isMoodboardSaving,
  hasUnsavedChanges,
  photos,
  isAutoFillLoading,
  autoFillPlaceholders,
  onPinMoodboard,
  isScreenshotLoading,
}: MoodboardHeaderProps) {
  const { isLoading } = useStreamContext();

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top row - Title, Save Indicator, and Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full items-start sm:items-center">
        {/* Left side - Title and Save Indicator */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 flex-1 min-w-0">
          <div className="min-w-[200px]">
            <EditableInput
              value={moodboard.title}
              onSave={async (newValue) => {
                await patchMoodboard(brandId, moodboard.id, {
                  title: newValue,
                });
              }}
            />
          </div>
          <MoodboardSaveIndicator
            isMoodboardSaving={isMoodboardSaving}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </div>

        {/* Right side - Action Buttons */}
        <div className="flex items-center gap-2">
          {onPinMoodboard && (
            <Button
              disabled={isLoading || isScreenshotLoading}
              onClick={onPinMoodboard}
              size="lg"
              className="flex items-center gap-2"
            >
              {isScreenshotLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
              {isScreenshotLoading ? "Analyzing..." : "Ask Kittykat"}
            </Button>
          )}
          <MoodboardControls
            photos={photos}
            isAutoFillLoading={isAutoFillLoading}
            autoFillPlaceholders={autoFillPlaceholders}
          />
        </div>
      </div>
    </div>
  );
}

export default MoodboardHeader;
