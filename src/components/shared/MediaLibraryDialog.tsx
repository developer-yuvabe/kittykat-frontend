// MediaLibraryDialog.tsx
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MediaLibrary } from "@/app/(main)/gallery/_components/MediaLibrary";
import {
  EnhancedSelectedFilters,
  GalleryItemResponse,
} from "@/types/gallery.types";

interface MediaLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMediaItemSelected?: (url: string) => void;
  onFullMediaItemSelected?: (item: GalleryItemResponse) => void;
  onMultipleMediaItemsSelected?: (items: GalleryItemResponse[]) => void; // 👈 new prop for multi-select
  filters?: EnhancedSelectedFilters;
  brandId?: string;
  campaignId?: string;
  moodboardId?: string;
  inSelectionGalleryIds?: string[]; // gallery item ids that are already selected
  isMultiSelect?: boolean; // 👈 new prop to enable multi-select mode
  maxSelectionCount?: number;
}

export function MediaLibraryDialog({
  open,
  onOpenChange,
  onMediaItemSelected,
  onFullMediaItemSelected,
  onMultipleMediaItemsSelected,
  filters,
  brandId,
  campaignId,
  moodboardId,
  inSelectionGalleryIds,
  isMultiSelect = false,
  maxSelectionCount,
}: MediaLibraryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90%] min-w-6xl overflow-y-scroll p-0">
        <div className="px-4">
          <MediaLibrary
            activeTab="all-media"
            isMediaSelectDialog={true}
            onMediaItemSelected={onMediaItemSelected}
            onFullMediaItemSelected={onFullMediaItemSelected}
            onMultipleMediaItemsSelected={onMultipleMediaItemsSelected}
            filters={filters}
            brandId={brandId}
            campaignId={campaignId}
            moodboardId={moodboardId}
            inSelectionGalleryIds={inSelectionGalleryIds}
            isMultiSelect={isMultiSelect}
            maxSelectionCount={maxSelectionCount}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
