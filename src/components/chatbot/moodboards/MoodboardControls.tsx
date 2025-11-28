"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { RegenerateIcon } from "@/components/ui/custom-icon";
import type { Photo } from "react-photo-album";
import { SortablePhoto } from "@/components/gallery/CustomGalleryContainer";
import { useState } from "react";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";

interface MoodboardControlsProps {
  photos: SortablePhoto<Photo>[];
  isAutoFillLoading: boolean;
  autoFillPlaceholders: () => void;
  clearMoodboard: () => void;
}

function MoodboardControls({
  photos,
  isAutoFillLoading,
  autoFillPlaceholders,
  clearMoodboard,
}: MoodboardControlsProps) {
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleClearClick = () => {
    setShowClearDialog(true);
  };

  const handleConfirmClear = () => {
    clearMoodboard();
    setShowClearDialog(false);
  };
  return (
    <>
      <div className="flex gap-2 items-center justify-end">
        {/* Clear Moodboard Button*/}
        {photos.length > 0 && (
          <Button
            size="lg"
            disabled={isAutoFillLoading}
            className="flex items-center gap-1 py-1 whitespace-nowrap"
            onClick={handleClearClick}
          >
            <span>Clear Moodboard</span>
          </Button>
        )}

        {/* AutoFill All Button */}
        {photos.some((photo) => photo.is_placeholder) && (
          <Button
            size="lg"
            disabled={isAutoFillLoading}
            className="flex items-center gap-1 py-1 whitespace-nowrap"
            onClick={autoFillPlaceholders}
          >
            {isAutoFillLoading ? (
              <>
                <span>Autofill All</span>
                <Loader2 className="animate-spin text-white" />
              </>
            ) : (
              <>
                <RegenerateIcon color="white" />
                <span>Autofill All</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ReusableAlertDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title="Clear Moodboard"
        description="Are you sure you want to clear all images from this moodboard?"
        confirmLabel="Clear"
        cancelLabel="Cancel"
        onConfirm={handleConfirmClear}
        danger
      />
    </>
  );
}

export default MoodboardControls;
