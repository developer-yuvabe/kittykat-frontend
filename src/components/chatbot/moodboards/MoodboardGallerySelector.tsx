"use client";

import { ChevronDown, Upload, Loader2 } from "lucide-react";
import React, { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Make sure this path is correct
import { MediaLibraryDialog } from "../../shared/MediaLibraryDialog";
import { addImageToMoodboard } from "@/services/api/moodboard.service";
import { toast } from "sonner";

export function MoodboardGallerySelector({
  brandId,
  campaignId,
  moodboardId,
  hasUnsavedChanges,
  inSelectionGalleryIds,
}: {
  brandId: string;
  campaignId: string;
  moodboardId: string;
  hasUnsavedChanges: boolean;
  inSelectionGalleryIds: string[];
}) {
  const [loading, setLoading] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = React.useState<
    null | "model" | "product" | "all-media"
  >(null);

  const isDisabled = loading || hasUnsavedChanges;
  console.log("des", isDisabled);
  return (
    <div>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setMediaLibraryOpen("all-media")}
              className="inline-flex items-center space-x-2 border-2 text-gray-700 rounded-md px-3 py-3 text-sm font-medium disabled:opacity-50"
              style={{ borderColor: "#7F55E0" }}
              disabled={isDisabled}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Select From Gallery</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          </TooltipTrigger>
          {hasUnsavedChanges && (
            <TooltipContent side="top">
              You have unsaved changes. Please save them before selecting from
              the gallery.
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
              for (const item of items) {
                await addImageToMoodboard(brandId, campaignId, moodboardId, {
                  id: item.id,
                });
              }
            })(),
            {
              loading: "Adding selected media...",
              success: `Added ${items.length} media items to moodboard!`,
              error: "Failed to add one or more media items.",
            }
          );

          setMediaLibraryOpen(null);
        }}
        inSelectionGalleryIds={inSelectionGalleryIds}
        maxSelectionCount={16}
      />
    </div>
  );
}
