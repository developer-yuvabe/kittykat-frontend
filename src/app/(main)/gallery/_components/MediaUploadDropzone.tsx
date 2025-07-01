"use client";

import React, { useState, useCallback, Dispatch, SetStateAction } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { useGalleryQuery } from "@/hooks/useGallery";
import type {
  GalleryFilters,
  BrandCampaignListResponse,
  GalleryItem,
  MediaWithStatus,
} from "@/types/gallery.types";
import {
  acceptedFileTypes,
  createGalleryItemFromFile,
  getStatusColor,
  getStatusIcon,
} from "@/lib/gallery.utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MediaUploadBrandSelector } from "./MediaUploadBrandSelector";

interface UploadDropzoneProps {
  activeTab: string;
  onUploadComplete?: (urls: string[]) => void;
  addToGallery?: boolean;
  galleryFilters?: GalleryFilters;
  source: string;
  selectedBrand?: BrandCampaignListResponse["brands"][number] | null;
  setSelectedBrand?: React.Dispatch<
    React.SetStateAction<BrandCampaignListResponse["brands"][number] | null>
  >;
  brands: BrandCampaignListResponse["brands"];
  brandsLoading: boolean;
  selectedCampaignId: string | undefined;
  selecteMoodboardId: string | undefined;
  setSelectedCampaignId: Dispatch<SetStateAction<string | undefined>>;
}

export function MediaUploadDropzone({
  activeTab,
  onUploadComplete,
  addToGallery = true,
  galleryFilters = {},
  source,
  selectedBrand,
  setSelectedBrand,
  brands,
  brandsLoading,
  selectedCampaignId,
  selecteMoodboardId,
  setSelectedCampaignId,
}: UploadDropzoneProps) {
  console.log("brands", brands);

  const [mediaWithStatus, setMediaWithStatus] = useState<MediaWithStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  // Use gallery hook to get addToGallery mutation
  const { addToGallery: addToGalleryMutation } =
    useGalleryQuery(galleryFilters);

  const currentConfig = acceptedFileTypes[
    activeTab as keyof typeof acceptedFileTypes
  ] ?? {
    types: {
      "image/*": [],
    },
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
        // Update status to uploading
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

        // Add to gallery if enabled
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
          error instanceof Error ? error.message : "Upload failed";

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
      const urls = await Promise.allSettled(uploadPromises);
      const successfulUrls = urls
        .filter(
          (result): result is PromiseFulfilledResult<string> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value);

      const failedCount = urls.length - successfulUrls.length;

      if (successfulUrls.length > 0) {
        // Call the callback with successful URLs
        onUploadComplete?.(successfulUrls);
      }

      if (failedCount > 0) {
        toast.error(
          `${failedCount} file${failedCount > 1 ? "s" : ""} failed to upload`,
          {
            description: "Please try again",
            duration: 3000,
          }
        );
      }
    } catch (error) {
      console.log(error);
      toast.error("Upload failed", {
        description: "Please try again",
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const uploadUrls = async (urls: string[]) => {
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
              asset_source: source,
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
              moodboard_id: selecteMoodboardId,
            };
            addToGalleryMutation(galleryItem);
          } catch (galleryError) {
            console.warn("Failed to add to gallery:", galleryError);
            // Don't fail the upload if gallery addition fails
          }
        }
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
          (result): result is PromiseFulfilledResult<void> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value);

      const failedCount = results.length - successfulUrls.length;

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

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;

    const urls = urlInput
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length > 0) {
      uploadUrls(urls);
      setUrlInput("");
      setShowUrlInput(false);
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

  let borderColor = "border-gray-300";
  if (isDragActive) borderColor = "border-purple-500";
  if (isDragAccept) borderColor = "border-green-500";
  if (isDragReject) borderColor = "border-red-500";

  return (
    <div className="space-y-4 relative">
      {/* Upload Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors duration-200 ease-in-out cursor-pointer ${borderColor} ${
          isDragActive ? "bg-purple-50" : "bg-white"
        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="absolute z-30 top-1 left-4 bg-white w-min px-2">
          <h3 className="text-xs font-semibold">Brand </h3>
        </div>
        {/* Brand Selector */}
        <MediaUploadBrandSelector
          selectedBrand={selectedBrand}
          setSelectedBrand={setSelectedBrand}
          brands={brands}
          brandsLoading={brandsLoading}
          setSelectedCampaignId={setSelectedCampaignId}
          selectedCampaignId={selectedCampaignId}
        />
        <input {...getInputProps()} />

        <div className="flex gap-x-3">
          <Button
            variant="outline"
            className="bg-[#636AE8] hover:bg-[#636AE8] hover:text-white text-white mb-2"
            disabled={isUploading || brands.length === 0 || brandsLoading}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isUploading ? "Uploading..." : "Upload Files"}
          </Button>
          <Dialog open={showUrlInput} onOpenChange={setShowUrlInput}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isUploading || brands.length === 0 || brandsLoading}
                className="mb-2 border-[#636AE8] text-[#636AE8] hover:bg-[#636AE8] hover:text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <Link className="mr-2 h-4 w-4" />
                Add URLs
              </Button>
            </DialogTrigger>

            <DialogContent
              onPointerDownOutside={(e) => e.preventDefault()} // Prevent accidental close
              className="sm:max-w-md"
            >
              <DialogHeader>
                <DialogTitle>Add Media URLs</DialogTitle>
              </DialogHeader>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={`Enter media URLs (one per line)\nhttps://example.com/image1.jpg\nhttps://example.com/video1.mp4`}
                className="w-full p-3 border border-gray-300 rounded-md text-sm resize-none"
                rows={3}
                disabled={isUploading}
              />
              <DialogFooter className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUrlInput(false);
                    setUrlInput("");
                  }}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUrlSubmit();
                  }}
                  disabled={!urlInput.trim() || isUploading}
                  className="bg-[#636AE8] hover:bg-[#5A61D9] text-white"
                >
                  Add URLs
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {brands.length === 0 && !brandsLoading ? (
          <p className="text-sm text-gray-500">Set up a brand to get started</p>
        ) : (
          <p className="text-sm text-gray-500">
            {isDragActive
              ? "Drop media here to upload"
              : `${currentConfig.placeholder} or add URLs`}{" "}
            ({currentConfig.text})
            {addToGallery && (
              <span className="block text-xs text-purple-600 mt-1">
                Files will be added to brand gallery
              </span>
            )}
          </p>
        )}

        {mediaWithStatus.length > 0 && (
          <div className="mt-4 w-full max-w-md">
            <p className="text-xs font-medium text-gray-700 mb-1">Media:</p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {mediaWithStatus.map((mediaItem, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between text-xs py-2 px-3 rounded-md border ${
                    mediaItem.status === "error"
                      ? "bg-red-50 border-red-200"
                      : mediaItem.status === "success"
                      ? "bg-green-50 border-green-200"
                      : mediaItem.status === "uploading"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center min-w-0 flex-1">
                    {getStatusIcon(mediaItem.status)}
                    <span
                      className={`ml-2 truncate ${getStatusColor(
                        mediaItem.status
                      )}`}
                      title={
                        mediaItem.type === "url"
                          ? mediaItem.originalUrl
                          : mediaItem.name
                      }
                    >
                      {mediaItem.type === "url" && (
                        <Link className="inline w-3 h-3 mr-1" />
                      )}
                      {mediaItem.name}
                    </span>
                  </div>
                  <div className="flex items-center ml-2">
                    {mediaItem.status === "error" && (
                      <span
                        className="text-xs text-red-500 mr-2"
                        title={mediaItem.error}
                      >
                        Failed
                      </span>
                    )}
                    {mediaItem.status === "success" && mediaItem.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto text-xs text-blue-500 hover:text-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(mediaItem.url!);
                          toast.success("URL copied to clipboard");
                        }}
                      >
                        Copy URL
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(index);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
