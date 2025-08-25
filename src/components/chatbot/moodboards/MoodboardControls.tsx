"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { RegenerateIcon } from "@/components/ui/custom-icon";
import type { Photo } from "react-photo-album";
import { SortablePhoto } from "@/components/gallery/CustomGalleryContainer";

interface MoodboardControlsProps {
  photos: SortablePhoto<Photo>[];
  isAutoFillLoading: boolean;
  autoFillPlaceholders: () => void;
}

function MoodboardControls({
  photos,
  isAutoFillLoading,
  autoFillPlaceholders,
}: MoodboardControlsProps) {
  return (
    <div className="flex gap-2 items-center justify-end">
      {/* AutoFill All Button - leftmost */}
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
  );
}

export default MoodboardControls;
