// components/MoodboardVisualSection.tsx

import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { MoodboardVisualImages } from "./MoodboardVisualImages";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { GalleryItem, BulkGalleryUploadRequest } from "@/types/gallery.types";
import { MoodboardInformation, ThreadCampaign } from "@/types/types";
import { GalleryActions } from "@/hooks/useGallery";
import { useBrandStore } from "@/store/brand.store";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { useMoodboardQuery } from "@/hooks/useMoodboardQuery";

interface MoodboardVisualSectionProps {
  currentMoodboard: MoodboardInformation | null;
  brandName?: string;
  currentCampaign: ThreadCampaign;
  moodboard: MoodboardInformation;
  galleryActions: GalleryActions;
}

export const MoodboardVisualSectionHeader = ({
  currentMoodboard,
  brandName,
  currentCampaign,
  moodboard,
  galleryActions,
}: MoodboardVisualSectionProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectedBrandId } = useBrandStore();

  const { refetchAllAutoFillQueries } = useMoodboardQuery({});
  if (!currentMoodboard) return null;

  const handleFileUpload = async (files: FileList) => {
    if (!files.length || !selectedBrandId) return;

    setIsUploading(true);
    const filesArray = Array.from(files);

    // Show loading toast
    const loadingToastId = toast.loading(
      `Uploading ${filesArray.length} file${
        filesArray.length > 1 ? "s" : ""
      }...`
    );

    let successCount = 0;
    let failedCount = 0;

    try {
      // Use bulk upload with concurrent processing for all batches
      const CONCURRENT_UPLOADS = 20;
      const chunks = [];
      for (let i = 0; i < filesArray.length; i += CONCURRENT_UPLOADS) {
        chunks.push(filesArray.slice(i, i + CONCURRENT_UPLOADS));
      }

      const galleryItems: GalleryItem[] = [];

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (file) => {
          try {
            // Upload file to GCS
            const downloadUrl = await uploadFileAndReturnUrl(
              file.name,
              file.type,
              "threads",
              file,
              selectedBrandId,
              currentCampaign.id
            );

            // Prepare gallery item
            const galleryItem: GalleryItem = {
              brand_id: selectedBrandId,
              campaign_id: currentCampaign.id,
              moodboard_id: moodboard.id,
              asset_title: file.name,
              asset_url: downloadUrl,
              asset_type: "image",
              asset_source: "brand-uploads",
              size: "unknown",
              media_format: file.type.split("/")[1] || "jpg",
              related_asset_ids: [],
              prompt_modifiers: [],
              ai_tags: [],
              visual_style_tags: {},
              detected_objects: [],
              detected_emotions: [],
              detected_colors: [],
              search_keywords: [],
              custom_tags: [],
            };

            return galleryItem;
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            failedCount++;
            return null;
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        galleryItems.push(...(chunkResults.filter(Boolean) as GalleryItem[]));
      }

      if (galleryItems.length === 0) {
        throw new Error("All file uploads failed");
      }

      // Bulk upload to gallery
      const bulkUploadRequest: BulkGalleryUploadRequest = {
        gallery_items: galleryItems,
        brand_id: selectedBrandId,
        campaign_id: currentCampaign.id,
        moodboard_id: moodboard.id,
      };

      const createdGalleryItems = await galleryActions.bulkUpload(
        bulkUploadRequest
      );
      successCount = createdGalleryItems.length;

      // Show final result toast
      if (failedCount === 0) {
        toast.success(
          `Successfully uploaded ${successCount} file${
            successCount > 1 ? "s" : ""
          }!`,
          {
            id: loadingToastId,
          }
        );
      } else if (successCount === 0) {
        toast.error(
          `Failed to upload ${failedCount} file${failedCount > 1 ? "s" : ""}`,
          {
            id: loadingToastId,
          }
        );
      } else {
        toast.warning(
          `Uploaded ${successCount} file${
            successCount > 1 ? "s" : ""
          }, ${failedCount} failed`,
          {
            id: loadingToastId,
          }
        );
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload files. Please try again.", {
        id: loadingToastId,
      });
    } finally {
      setIsUploading(false);
      galleryActions.refetchAllGalleryQueries();
      refetchAllAutoFillQueries();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFileUpload(files);
    }
    // Reset input value to allow selecting the same files again
    if (event.target) {
      event.target.value = "";
    }
  };

  return (
    <div className="mt-3">
      <p className="text-sm text-gray-800 mb-2">
        Your moodboard pulls images from your current gallery to create a visual
        aesthetic guide for this campaign. You can upload additional images here
        before generating, then fine-tune your visual style by selecting or
        deselecting the campaign tags below.
      </p>
      <div className="flex justify-between mt-3">
        <div className="font-semibold flex flex-row gap-x-2">
          {galleryActions.isFetching ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading images...
            </div>
          ) : (
            `${galleryActions.totalItems} images of ${brandName} found...`
          )}
        </div>

        <Button
          variant="outline"
          className="border-[#7F55E0] text-[#7F55E0] border-2"
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-1" />
          )}
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <MoodboardVisualImages
        currentMoodboard={currentMoodboard}
        galleryActions={galleryActions}
      />
    </div>
  );
};
