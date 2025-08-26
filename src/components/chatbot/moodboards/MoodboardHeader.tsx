"use client";

import { patchMoodboard } from "@/services/api/moodboard.service";
import EditableInput from "./EditableInput";
import MoodboardSaveIndicator from "./MoodboardSaveIndicator";
import MoodboardControls from "./MoodboardControls";
import type { Photo } from "react-photo-album";
import { SortablePhoto } from "@/components/gallery/CustomGalleryContainer";
import type { MoodboardInformation } from "@/types/types";

interface MoodboardHeaderProps {
  moodboard: MoodboardInformation;
  brandId: string;
  isMoodboardSaving: boolean;
  hasUnsavedChanges: boolean;
  photos: SortablePhoto<Photo>[];
  isAutoFillLoading: boolean;
  autoFillPlaceholders: () => void;
}

function MoodboardHeader({
  moodboard,
  brandId,
  isMoodboardSaving,
  hasUnsavedChanges,
  photos,
  isAutoFillLoading,
  autoFillPlaceholders,
}: MoodboardHeaderProps) {
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
        <MoodboardControls
          photos={photos}
          isAutoFillLoading={isAutoFillLoading}
          autoFillPlaceholders={autoFillPlaceholders}
        />
      </div>
    </div>
  );
}

export default MoodboardHeader;
