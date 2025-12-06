"use client";

import React from "react";
import { MediaLibraryDialog } from "../../shared/MediaLibraryDialog";
import { addImageToMoodboard } from "@/services/api/moodboard.service";
import { SelectIcon } from "@/components/ui/custom-icon";
import { GalleryItemResponse } from "@/types/gallery.types";
import { Button } from "@/components/ui/button";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";

export function MoodboardGallerySelector({
  brandId,
  campaignId,
  moodboardId,
  inSelectionGalleryIds,
  onGallerySelection,
  placeHolderIndex,
}: {
  brandId: string;
  campaignId: string;
  moodboardId: string;
  hasUnsavedChanges: boolean;
  inSelectionGalleryIds: string[];
  noOfImagesForMoodboard: number;
  onGallerySelection?: (
    selectedItems: GalleryItemResponse[],
    placeHolderIndex: number
  ) => void;
  placeHolderIndex: number;
}) {
  const [mediaLibraryOpen, setMediaLibraryOpen] = React.useState<
    null | "model" | "product" | "all-media"
  >(null);
  const { resetFilters } = useGalleryFilterStore();

  return (
    <div>
      <Button
        type="button"
        size={"lg"}
        variant={"outline"}
        onClick={(e) => {
          e.stopPropagation();
          // Reset all filters when opening moodboard selector
          resetFilters();
          setMediaLibraryOpen("all-media");
        }}
        className="rounded-t-none w-28"
      >
        <>
          <SelectIcon size={20} />
          <span>Gallery</span>
        </>
      </Button>

      <MediaLibraryDialog
        onFullMediaItemSelected={async (item) => {
          await addImageToMoodboard(brandId, campaignId, moodboardId, {
            id: item.id,
          });
          setMediaLibraryOpen(null);
          // Reset filters when closing dialog
          resetFilters();
        }}
        open={!!mediaLibraryOpen}
        onOpenChange={(o) => {
          if (!o) {
            setMediaLibraryOpen(null);
            // Reset filters when closing dialog
            resetFilters();
          }
        }}
        filters={{
          brands: [brandId],
          campaigns: [],
          product_categories: [],
          has_product: undefined,
          has_people: undefined,
          has_lifestyle_context: undefined,
          asset_types: ["image"],
          asset_sources: [],
          media_format: [],
          aspect_ratio: [],
          workflow_status: [],
          is_favourite: undefined,
          is_archived: undefined,
          moodboards: [],
        }}
        brandId={brandId}
        campaignId={campaignId}
        moodboardId={moodboardId}
        isMultiSelect
        onMultipleMediaItemsSelected={async (items) => {
          setMediaLibraryOpen(null);
          // Reset filters when closing dialog
          resetFilters();
          onGallerySelection?.(items, placeHolderIndex);
        }}
        inSelectionGalleryIds={inSelectionGalleryIds}
        maxSelectionCount={16}
      />
    </div>
  );
}
