"use client";

import { ChevronDown, Upload, Loader2 } from "lucide-react";
import React, { useState } from "react";

import { MediaLibraryDialog } from "../chatbot/a2i/MediaLibraryDialog";
import { addManualMoodboardImage } from "@/services/api/campaign.service";

export function UploadInput({
  brandId,
  campaignId,
}: {
  brandId: string;
  campaignId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = React.useState<
    null | "model" | "product" | "all-media"
  >(null);

  return (
    <div>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setMediaLibraryOpen("all-media")}
            className="inline-flex items-center space-x-2 border-2 text-gray-700 rounded-md px-3 py-3 text-sm font-medium disabled:opacity-50"
            style={{ borderColor: "#7F55E0" }}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Upload</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
          <MediaLibraryDialog
            onFullMediaItemSelected={async (item) => {
              await addManualMoodboardImage(brandId, campaignId, {
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
            }}
            brandId={brandId}
            campaignId={campaignId}
          />
        </div>
      )}
    </div>
  );
}
