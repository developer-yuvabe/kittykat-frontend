// MediaLibraryDialog.tsx
/**
 * MediaLibraryDialog - Modal for selecting media from the gallery
 * 
 * Important: This component uses isMediaSelectDialog={true} which enables dialog-specific behavior:
 * - Uses dialogCampaignId from the store instead of selectedCampaignId
 * - Campaign selection in the dialog is isolated from the main gallery page
 * - This ensures the home page and gallery page campaign selections stay in sync
 *   while allowing independent campaign selection within the dialog
 */
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MediaLibrary } from "@/app/(main)/gallery/_components/MediaLibrary";
import {
  EnhancedSelectedFilters,
  GalleryItemResponse,
} from "@/types/gallery.types";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";

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
    const {setSelectedItems} = useGalleryFilterStore()
  return (
    

    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] h-[90vh] min-w-9/12 overflow-hidden p-4 ">
        <div className="h-full w-full">
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
            hideHeader={true}
            closeDialog={() => {onOpenChange(false)
                setSelectedItems([])
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
