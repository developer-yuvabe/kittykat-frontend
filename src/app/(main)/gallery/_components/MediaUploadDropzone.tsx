// 1. Main MediaUploadDropzone (orchestrator)
"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { useGalleryQuery } from "@/hooks/useGallery";
import type {
  GalleryFilters,
  BrandCampaignListResponse,
  MediaWithStatus,
  GalleryItem,
} from "@/types/gallery.types";
import {
  acceptedFileTypes,
  createGalleryItemFromFile,
} from "@/lib/gallery.utils";
import { MediaUploadBrandSelector } from "./MediaUploadBrandSelector";
import { MediaUploadActions } from "./MediaUploadActions";
import { MediaUploadStatus } from "./MediaUploadStatus";
import { MediaUploadDropzoneArea } from "./MediaUploadDropzoneArea";

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
  setSelectedCampaignId: React.Dispatch<
    React.SetStateAction<string | undefined>
  >;
}

export function MediaUploadDropzone({
  activeTab,
  onUploadComplete,
  addToGallery = true,
  galleryFilters = {},
  selectedBrand,
  setSelectedBrand,
  brands,
  brandsLoading,
  selectedCampaignId,
  selecteMoodboardId,
  setSelectedCampaignId,
}: MediaUploadDropzoneProps) {
  const [mediaWithStatus, setMediaWithStatus] = useState<MediaWithStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { addToGallery: addToGalleryMutation } =
    useGalleryQuery(galleryFilters);

  const currentConfig = acceptedFileTypes[
    activeTab as keyof typeof acceptedFileTypes
  ] ?? {
    types: { "image/*": [] },
    text: "PNG, JPEG, WEBP",
    placeholder: "Drop media here to upload",
    assetType: "image",
  };

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    const newItemsWithStatus: MediaWithStatus[] = files.map((file) => ({
      name: file.name,
      file,
      status: "pending",
      type: "file",
    }));

    setMediaWithStatus((prev) => [...prev, ...newItemsWithStatus]);

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
          file
        );

        if (addToGallery && selectedBrand) {
          try {
            const galleryItem = await createGalleryItemFromFile(
              file,
              url,
              galleryFilters,
              activeTab,
              selectedBrand?.brand_id,
              selectedCampaignId,
              selecteMoodboardId
            );
            addToGalleryMutation(galleryItem);
          } catch (galleryError) {
            console.warn("Failed to add to gallery:", galleryError);
          }
        }

        setMediaWithStatus((prev) =>
          prev.map((item, idx) =>
            idx === itemIndex ? { ...item, status: "success", url } : item
          )
        );

        return url;
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

    try {
      const urls = await Promise.allSettled(uploadPromises);
      const successfulUrls = urls
        .filter(
          (result): result is PromiseFulfilledResult<string> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value);

      const failedCount = urls.length - successfulUrls.length;

      if (successfulUrls.length > 0) {
        onUploadComplete?.(successfulUrls);
      }

      if (failedCount > 0) {
        toast.error(
          `${failedCount} file${failedCount > 1 ? "s" : ""} failed to upload`,
          { description: "Please try again", duration: 3000 }
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Upload failed", {
        description: "Please try again",
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlUpload = async (urls: string[]) => {
    setIsUploading(true);
    const newItemsWithStatus: MediaWithStatus[] = urls.map((url) => ({
      name: url.split("/").pop() || url,
      originalUrl: url,
      status: "pending",
      type: "url",
    }));

    setMediaWithStatus((prev) => [...prev, ...newItemsWithStatus]);

    const uploadPromises = urls.map(async (url, index) => {
      const itemIndex = mediaWithStatus.length + index;

      try {
        // Update status to uploading
        setMediaWithStatus((prev) =>
          prev.map((item, idx) =>
            idx === itemIndex ? { ...item, status: "uploading" } : item
          )
        );

        // Add to gallery if enabled
        if (addToGallery && selectedBrand) {
          try {
            // Get extension from URL
            const extension =
              url.split(".").pop()?.split(/\#|\?/)[0]?.toLowerCase() || "";
            const galleryItem: GalleryItem = {
              brand_id: selectedBrand.brand_id,
              asset_url: url,
              asset_source: activeTab,
              asset_type: "image",
              media_format: extension,
              asset_title: url,
              size: "",
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
              campaign_id: selectedCampaignId,
              moodboard_id: selecteMoodboardId,
              is_master: true,
            };
            addToGalleryMutation(galleryItem);
          } catch (galleryError) {
            console.warn("Failed to add to gallery:", galleryError);
            // Don't fail the upload if gallery addition fails
          }
        }

        // Update status to success
        setMediaWithStatus((prev) =>
          prev.map((item, idx) =>
            idx === itemIndex ? { ...item, status: "success", url } : item
          )
        );

        return url;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "URL upload failed";

        // Update status to error
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

    try {
      const results = await Promise.allSettled(uploadPromises);
      const successfulUrls = results
        .filter(
          (result): result is PromiseFulfilledResult<string> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value);

      const failedCount = results.length - successfulUrls.length;

      if (successfulUrls.length > 0) {
        onUploadComplete?.(successfulUrls);
      }

      if (failedCount > 0) {
        toast.error(
          `${failedCount} URL${failedCount > 1 ? "s" : ""} failed to upload`,
          {
            description: "Please try again",
            duration: 3000,
          }
        );
      }
    } catch (error) {
      console.log(error);
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
    disabled: isUploading,
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
