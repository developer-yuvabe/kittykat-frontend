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
  filters?: EnhancedSelectedFilters;
  brandId?: string;
  campaignId?: string;
  onFullMediaItemSelected?: (item: GalleryItemResponse) => void; // 👈 new prop
}

export function MediaLibraryDialog({
  open,
  onOpenChange,
  onMediaItemSelected,
  filters,
  brandId,
  campaignId,
  onFullMediaItemSelected,
}: MediaLibraryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90%] min-w-6xl overflow-y-scroll p-0">
        <div className="px-4">
          <MediaLibrary
            activeTab="all-media"
            isMediaSelectDialog={true}
            onMediaItemSelected={onMediaItemSelected}
            filters={filters}
            brandId={brandId}
            campaignId={campaignId}
            onFullMediaItemSelected={onFullMediaItemSelected}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
