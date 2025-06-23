// components/MoodboardVisualSection.tsx

import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { MoodboardVisualImages } from "./MoodboardVisualImages";
import { useState, useRef } from "react";
import { toast } from "sonner";

import { GalleryItem, GalleryItemResponse } from "@/types/gallery.types";
import { MoodboardInformation, ThreadCampaign } from "@/types/types";
import { PintrestIcon, InstagramIcon } from "@/components/ui/custom-icon";
import { useGalleryQuery } from "@/hooks/useGallery";
import { useBrandStore } from "@/store/brand.store";
import {
  addGalleryItemToMoodboard,
  analyzeMoodboardImages,
} from "@/services/api/moodboard.service";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";

interface MoodboardVisualSectionProps {
  currentMoodboard: MoodboardInformation | null;
  isCreatingNewMoodboard: boolean;
  galleryItems: GalleryItemResponse[];
  brandName?: string;
  currentCampaign: ThreadCampaign;
  moodboard: MoodboardInformation;
}

export const MoodboardVisualSectionHeader = ({
  currentMoodboard,
  isCreatingNewMoodboard,
  galleryItems,
  brandName,
  currentCampaign,
  moodboard,
}: MoodboardVisualSectionProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectedBrandId } = useBrandStore();
  const { addToGallery } = useGalleryQuery({
    selectedFilters: {
      campaigns: currentCampaign?.id ? [currentCampaign.id] : [],
      moodboards: currentMoodboard?.id ? [currentMoodboard.id] : [],
      brands: selectedBrandId ? [selectedBrandId] : [],
      product_categories: [],
      asset_types: [],
      asset_sources: [],
      media_format: [],
      aspect_ratio: [],
      workflow_status: [],
    },
  });

  if (!currentMoodboard || isCreatingNewMoodboard) return null;

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
      // Process files concurrently with a limit
      const CONCURRENT_UPLOADS = 3;
      const chunks = [];
      for (let i = 0; i < filesArray.length; i += CONCURRENT_UPLOADS) {
        chunks.push(filesArray.slice(i, i + CONCURRENT_UPLOADS));
      }

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (file) => {
          try {
            // Upload file
            const downloadUrl = await uploadFileAndReturnUrl(
              file.name,
              file.type,
              "threads",
              file
            );

            // Create gallery item
            const galleryItem: GalleryItem = {
              brand_id: selectedBrandId,
              campaign_id: currentCampaign.id,
              moodboard_id: moodboard.id,
              asset_title: file.name,
              asset_url: downloadUrl,
              asset_type: "image",
              asset_source: "upload",
              size: "unknown",
              media_format: file.type.split("/")[1] || "jpg",
              related_asset_ids: [],
              prompt_modifiers: [],
              ai_tags: [],
              visual_style_tags: [],
              detected_objects: [],
              detected_emotions: [],
              detected_colors: [],
              intent_tags: [],
              search_keywords: [],
              custom_tags: [],
            };

            // Add to gallery
            const galleryResponse = await addToGallery(galleryItem);
            const galleryItemId = galleryResponse.id;

            // Add to moodboard
            await addGalleryItemToMoodboard(selectedBrandId, moodboard.id, {
              gallery_item_id: galleryItemId,
            });

            successCount++;
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            failedCount++;
          }
        });

        await Promise.all(chunkPromises);
      }

      // Step 3: Analyze the newly created moodboard
      await analyzeMoodboardImages(
        selectedBrandId,
        currentCampaign.id,
        moodboard.id,
        {
          reanalyze: true,
        }
      );
    } finally {
      setIsUploading(false);

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
    <div className="mt-6">
      <div className="flex justify-between">
        <div className="font-semibold flex flex-row gap-x-2">
          {`${currentMoodboard.visual_style_images.length} images of ${brandName} found...`}
          <PintrestIcon />
          <InstagramIcon />
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
        galleryItems={galleryItems}
      />
    </div>
  );
};
