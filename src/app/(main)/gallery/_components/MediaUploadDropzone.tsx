"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { ITEMS_PER_PAGE, useGalleryQuery } from "@/hooks/useGallery";
import type {
  GalleryFilters,
  BrandCampaignListResponse,
  MediaWithStatus,
  GalleryItem,
  BulkGalleryUploadRequest,
} from "@/types/gallery.types";
import { acceptedFileTypes, getAssetTypeFromUrl } from "@/lib/gallery.utils";
import { MediaUploadActions } from "./MediaUploadActions";
import { MediaUploadStatus } from "./MediaUploadStatus";
import { MediaUploadDropzoneArea } from "./MediaUploadDropzoneArea";
import { getExtensionFromUrl } from "@/lib/utils";

interface MediaUploadDropzoneProps {
  activeTab: string;
  onUploadComplete?: (urls: string[]) => void;
  addToGallery?: boolean;
  galleryFilters?: GalleryFilters;
  selectedBrand?: BrandCampaignListResponse["brands"][number] | null;
  setSelectedBrand?: React.Dispatch<
    React.SetStateAction<BrandCampaignListResponse["brands"][number] | null>
  >;
  brands: BrandCampaignListResponse["brands"];
  brandsLoading: boolean;
  selectedCampaignId: string | undefined;
  selecteMoodboardId: string | undefined;
}

export function MediaUploadDropzone({
  activeTab,
  onUploadComplete,
  addToGallery = true,
  galleryFilters = {},
  selectedBrand,
  brands,
  brandsLoading,
  selectedCampaignId,
  selecteMoodboardId,
}: MediaUploadDropzoneProps) {
  const [mediaWithStatus, setMediaWithStatus] = useState<MediaWithStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);

  const galleryActions = useGalleryQuery(
    galleryFilters,
    ITEMS_PER_PAGE,
    false,
    "MediaUploadDropzone"
  );

  const currentConfig = acceptedFileTypes[
    activeTab as keyof typeof acceptedFileTypes
  ] ?? {
    types: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/svg+xml": [".svg"],
      "video/mp4": [".mp4"],
      "video/quicktime": [".mov"],
      "video/x-msvideo": [".avi"],
      "image/tiff": [".tiff", ".tif"],
      "image/webp": [".webp"],
      "image/bmp": [".bmp"],
      "image/gif": [".gif"],
      "image/psd": [".psd"],
    },
    text: "PNG, JPEG, MP4",
    placeholder: "Drop media here to upload",
    assetType: "image",
  };

  const uploadFiles = async (files: File[]) => {
    if (!selectedBrand?.brand_id) {
      toast.error("No brand selected.");
      return;
    }

    setIsUploading(true);
    const newItemsWithStatus: MediaWithStatus[] = files.map((file) => ({
      name: file.name,
      file,
      status: "pending",
      type: "file",
    }));

    setMediaWithStatus((prev) => [...prev, ...newItemsWithStatus]);

    try {
      // First, upload all files to GCS
      const uploadPromises = files.map(async (file, index) => {
        const itemIndex = mediaWithStatus.length + index;

        try {
          setMediaWithStatus((prev) =>
            prev.map((item, idx) =>
              idx === itemIndex ? { ...item, status: "uploading" } : item
            )
          );

          const url = await uploadFileAndReturnUrl(
            file.name,
            file.type,
            "brands",
            file,
            selectedBrand.brand_id,
            selectedCampaignId || null
          );

          setMediaWithStatus((prev) =>
            prev.map((item, idx) =>
              idx === itemIndex ? { ...item, status: "success", url } : item
            )
          );

          return { file, url };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Upload failed";

          setMediaWithStatus((prev) =>
            prev.map((item, idx) =>
              idx === itemIndex
                ? { ...item, status: "error", error: errorMessage }
                : item
            )
          );

          throw error;
        }
      });

      const uploadResults = await Promise.allSettled(uploadPromises);
      const successfulUploads = uploadResults
        .filter(
          (
            result
          ): result is PromiseFulfilledResult<{ file: File; url: string }> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value);

      const failedCount = uploadResults.length - successfulUploads.length;

      if (successfulUploads.length > 0) {
        const urls = successfulUploads.map(({ url }) => url);
        onUploadComplete?.(urls);

        // If addToGallery is enabled, add to gallery
        if (addToGallery) {
          const itemsToUpload: GalleryItem[] = successfulUploads.map(
            ({ file, url }) => ({
              brand_id: selectedBrand.brand_id,
              asset_url: url,
              asset_title: file.name,
              asset_type: file.type.startsWith("video/") ? "video" : "image",
              asset_source: activeTab,
              size: `${file.size}`,
              search_keywords: [],
              custom_tags: [],
              related_asset_ids: [],
              prompt_modifiers: [],
              ai_tags: [],
              visual_style_tags: {},
              detected_objects: [],
              detected_emotions: [],
              detected_colors: [],
              media_format: getExtensionFromUrl(url),
              campaign_id: selectedCampaignId,
              moodboard_id: selecteMoodboardId,
              is_master: true,
            })
          );

          try {
            // For less than 5 images, use parallel synchronous calls like in MoodboardGallerySelector
            if (successfulUploads.length < 5) {
              const addToGalleryPromises = itemsToUpload.map(
                async (galleryItem) => {
                  try {
                    await galleryActions.addToGallery(galleryItem);
                    return true;
                  } catch (error) {
                    console.error(
                      `Failed to add ${galleryItem.asset_title} to gallery:`,
                      error
                    );
                    return false;
                  }
                }
              );

              const galleryResults = await Promise.all(addToGalleryPromises);
              const gallerySuccessCount = galleryResults.filter(Boolean).length;
              const galleryFailedCount =
                galleryResults.length - gallerySuccessCount;

              if (galleryFailedCount === 0) {
                toast.success(
                  `${gallerySuccessCount} file(s) uploaded to gallery successfully!`
                );
              } else if (gallerySuccessCount === 0) {
                toast.error(
                  "Files uploaded but failed to add to gallery. Please try again."
                );
              } else {
                toast.warning(
                  `${gallerySuccessCount} file(s) uploaded successfully, ${galleryFailedCount} failed to add to gallery.`
                );
              }
            } else {
              // For 5 or more images, use bulk upload
              const bulkUploadPayload: BulkGalleryUploadRequest = {
                gallery_items: itemsToUpload,
                brand_id: selectedBrand.brand_id,
                scrape_only: false,
              };

              await galleryActions.bulkUpload(bulkUploadPayload);
              toast.success(
                `${successfulUploads.length} file(s) uploaded to gallery successfully!`
              );
            }
          } catch (galleryError) {
            console.error("Gallery upload failed:", galleryError);
            toast.error(
              "Files uploaded but failed to add to gallery. Please try again."
            );
          }
        }
      }

      if (failedCount > 0) {
        toast.error(
          `${failedCount} file${failedCount > 1 ? "s" : ""} failed to upload`,
          { description: "Please try again", duration: 3000 }
        );
      }
    } catch (error) {
      console.error("Upload process failed:", error);
      toast.error("Upload failed", {
        description: "Please try again",
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlUpload = async (urls: string[]) => {
    if (!selectedBrand?.brand_id) {
      toast.error("No brand selected.");
      return;
    }

    setIsUploading(true);
    const newItemsWithStatus: MediaWithStatus[] = urls.map((url) => ({
      name: url.split("/").pop() || url,
      originalUrl: url,
      status: "pending",
      type: "url",
    }));

    setMediaWithStatus((prev) => [...prev, ...newItemsWithStatus]);

    try {
      // Validate and process URLs
      const validUrls = urls.filter((url) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });

      if (validUrls.length === 0) {
        toast.error("No valid URLs provided");
        return;
      }

      // Update status for all items to uploading
      setMediaWithStatus((prev) =>
        prev.map((item) =>
          item.type === "url" ? { ...item, status: "uploading" } : item
        )
      );

      // If addToGallery is enabled, bulk upload URLs to gallery
      if (addToGallery) {
        const itemsToUpload: GalleryItem[] = validUrls.map((url) => {
          const extension = getExtensionFromUrl(url);
          const assetType = getAssetTypeFromUrl(url);

          return {
            brand_id: selectedBrand.brand_id,
            asset_url: url,
            asset_source: activeTab,
            asset_type: assetType === "video" ? "video" : "image",
            media_format: extension,
            asset_title: url.split("/").pop() || url,
            size: "",
            related_asset_ids: [],
            prompt_modifiers: [],
            ai_tags: [],
            visual_style_tags: {},
            detected_objects: [],
            detected_emotions: [],
            detected_colors: [],
            search_keywords: [],
            custom_tags: [],
            campaign_id: selectedCampaignId,
            moodboard_id: selecteMoodboardId,
            is_master: true,
          };
        });

        const bulkUploadPayload: BulkGalleryUploadRequest = {
          gallery_items: itemsToUpload,
          brand_id: selectedBrand.brand_id,
          scrape_only: false,
        };

        await galleryActions.bulkUpload(bulkUploadPayload);
        toast.success(
          `${validUrls.length} URL(s) uploaded to gallery successfully!`
        );
      }

      // Update status to success for all items
      setMediaWithStatus((prev) =>
        prev.map((item) =>
          item.type === "url"
            ? { ...item, status: "success", url: item.originalUrl }
            : item
        )
      );

      onUploadComplete?.(validUrls);
    } catch (error) {
      console.error("URL upload failed:", error);

      // Update status to error for all URL items
      setMediaWithStatus((prev) =>
        prev.map((item) =>
          item.type === "url"
            ? { ...item, status: "error", error: "URL upload failed" }
            : item
        )
      );

      toast.error("URL upload failed", {
        description: "Please try again",
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        uploadFiles(acceptedFiles);
      }
    },
    [uploadFiles, activeTab]
  );

  const removeItem = (index: number) => {
    setMediaWithStatus((prev) => prev.filter((_, idx) => idx !== index));
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    multiple: true,
    accept: currentConfig.types,
    disabled: isUploading || isUrlDialogOpen,
  });

  const isDisabled = isUploading || brands.length === 0 || brandsLoading;

  return (
    <div className="space-y-4 relative">
      <MediaUploadDropzoneArea
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
        isDragAccept={isDragAccept}
        isDragReject={isDragReject}
        isUploading={isUploading}
      >
        <MediaUploadActions
          isDisabled={isDisabled}
          isUploading={isUploading}
          onUrlUpload={handleUrlUpload}
          isUrlDialogOpen={isUrlDialogOpen}
          setIsUrlDialogOpen={setIsUrlDialogOpen}
        />

        <MediaUploadStatus
          brands={brands}
          brandsLoading={brandsLoading}
          isDragActive={isDragActive}
          currentConfig={currentConfig}
          addToGallery={addToGallery}
          mediaWithStatus={mediaWithStatus}
          onRemoveItem={removeItem}
        />
      </MediaUploadDropzoneArea>
    </div>
  );
}
