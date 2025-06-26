"use client";

import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Make sure this path is correct
import { MediaLibraryDialog } from "../../shared/MediaLibraryDialog";
import { addImageToMoodboard } from "@/services/api/moodboard.service";
import { toast } from "sonner";
import { SelectIcon } from "@/components/ui/custom-icon";

export function MoodboardGallerySelector({
  brandId,
  campaignId,
  moodboardId,
  hasUnsavedChanges,
  inSelectionGalleryIds,
  setNoOfImagesForMoodboard,
  noOfImagesForMoodboard,
  assetsLength,
}: {
  brandId: string;
  campaignId: string;
  moodboardId: string;
  hasUnsavedChanges: boolean;
  inSelectionGalleryIds: string[];
  setNoOfImagesForMoodboard: (count: number) => void;
  noOfImagesForMoodboard: number;
  assetsLength: number;
}) {
  const [loading, setLoading] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = React.useState<
    null | "model" | "product" | "all-media"
  >(null);

  const isDisabled =
    loading ||
    hasUnsavedChanges ||
    assetsLength >= 16 ||
    noOfImagesForMoodboard >= 16;

  return (
    <div>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative inline-block">
              {/* Label positioned above the button */}
              <span
                className="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-gray-700 z-10"
                style={{ lineHeight: 1 }}
              >
                Select From
              </span>

              <button
                type="button"
                onClick={() => setMediaLibraryOpen("all-media")}
                className="inline-flex items-center space-x-12 border-2 text-gray-700 rounded-md px-3 py-3 text-sm font-medium disabled:opacity-50"
                style={{ borderColor: "#7F55E0" }}
                disabled={isDisabled}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Gallery</span>
                    <SelectIcon size={20} />
                  </>
                )}
              </button>
            </div>
          </TooltipTrigger>
          {hasUnsavedChanges && (
            <TooltipContent side="top">
              You have unsaved changes. Please save them before selecting from
              the gallery.
            </TooltipContent>
          )}
          {noOfImagesForMoodboard >= 16 && (
            <TooltipContent side="top">
              Moodboard cannot exceed 16 images.
            </TooltipContent>
          )}
        </Tooltip>
      )}

      <MediaLibraryDialog
        onFullMediaItemSelected={async (item) => {
          await addImageToMoodboard(brandId, campaignId, moodboardId, {
            id: item.id,
          });
          setMediaLibraryOpen(null);
        }}
        open={!!mediaLibraryOpen}
        onOpenChange={(o) => {
          if (!o) {
            setMediaLibraryOpen(null);
          }
        }}
        filters={{
          brands: [brandId],
          campaigns: [campaignId],
          product_categories: [],
          has_product: undefined,
          has_people: undefined,
          has_lifestyle_context: undefined,
          asset_types: [],
          asset_sources: [],
          media_format: [],
          aspect_ratio: [],
          workflow_status: [],
          is_favourite: undefined,
          is_archived: undefined,
          moodboards: [moodboardId],
        }}
        brandId={brandId}
        campaignId={campaignId}
        moodboardId={moodboardId}
        isMultiSelect
        onMultipleMediaItemsSelected={async (items) => {
          toast.promise(
            (async () => {
              let count = noOfImagesForMoodboard;

              for (const item of items) {
                if (count >= 16) {
                  toast.warning(
                    "You can add a maximum of 16 images to the moodboard."
                  );
                  break;
                }

                await addImageToMoodboard(brandId, campaignId, moodboardId, {
                  id: item.id,
                });
                count += 1;
                setNoOfImagesForMoodboard(count);
                setMediaLibraryOpen(null);
              }
            })(),
            {
              loading: "Adding selected media...",
              success: `Added media items to moodboard!`,
              error: "Failed to add one or more media items.",
            }
          );
        }}
        inSelectionGalleryIds={inSelectionGalleryIds}
        maxSelectionCount={16}
      />
    </div>
  );
}
