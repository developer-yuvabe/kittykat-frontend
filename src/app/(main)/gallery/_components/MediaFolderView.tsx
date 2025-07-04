"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  X,
  Loader2,
  Check,
  ChevronUp,
  ChevronDown,
  Link,
  Folder,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { useGalleryQuery } from "@/hooks/useGallery";
import { useQueryState } from "nuqs";
import { useInView } from "react-intersection-observer";
import type {
  GalleryFilters,
  FileWithStatus,
  BrandCampaignListResponse,
  GalleryItem,
} from "@/types/gallery.types";
import {
  acceptedFileTypes,
  createGalleryItemFromFile,
  getStatusColor,
  getStatusIcon,
} from "@/lib/gallery.utils";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CampaignCard } from "./CampaignCard";
import { MediaGrid } from "./MediaGrid";
import { MediaGalleryStatusDisplay } from "./MediaGalleryStatusDisplay";
import { MediaBulkActions } from "./MediaBulkActions";

// Extended interface to handle both files and URLs
interface MediaWithStatus extends Omit<FileWithStatus, "file"> {
  file?: File;
  url?: string;
  originalUrl?: string;
  name: string;
  type: "file" | "url";
}

interface UploadDropzoneProps {
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
  galleryView: "folder" | "grid";
}

export function MediaFolderView({
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
  galleryView = "grid",
}: UploadDropzoneProps) {
  console.log("brands", brands);

  const [mediaWithStatus, setMediaWithStatus] = useState<MediaWithStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Determine which items are currently selected for display

  const handleSelect = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedItems((prev) => [...prev, id]);
    } else {
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  // Intersection observer for infinite scroll
  const { ref, inView } = useInView();

  // URL state management for campaign selection
  const [selectedCampaignFromUrl, setSelectedCampaignFromUrl] = useQueryState(
    "campaign",
    {
      defaultValue: selectedCampaignId || "",
    }
  );

  // Use gallery hook to get addToGallery mutation and gallery items
  const galleryActions = useGalleryQuery({
    selectedFilters: {
      brands: selectedBrand ? [selectedBrand.brand_id] : [],
      campaigns: selectedCampaign ? [selectedCampaign] : [],
      moodboards: [],
      product_categories: [],
      asset_types: [],
      asset_sources: [],
      media_format: [],
      aspect_ratio: [],
      workflow_status: [],
    },
  });

  // Get the actual selected items data
  const selectedItemsData = galleryActions.galleryItems.filter((item) =>
    selectedItems.includes(item.id)
  );

  const handleUnselectAll = () => {
    setSelectedItems([]);
  };
  // Fetch next page when in view
  React.useEffect(() => {
    if (
      inView &&
      galleryActions.hasNextPage &&
      !galleryActions.isFetchingNextPage
    ) {
      galleryActions.fetchNextPage();
    }
  }, [
    inView,
    galleryActions.hasNextPage,
    galleryActions.isFetchingNextPage,
    galleryActions.fetchNextPage,
  ]);

  const currentConfig = acceptedFileTypes[
    activeTab as keyof typeof acceptedFileTypes
  ] ?? {
    types: {
      "image/*": [],
      "video/*": [],
    },
    text: "PNG, JPEG, MP4",
    placeholder: "Drop media here to upload",
    assetType: "image",
  };

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaignFromUrl(campaignId);
    setSelectedCampaign(campaignId);
  };

  const handleBackToCampaigns = () => {
    setSelectedCampaign(null);
    setSelectedCampaignFromUrl("");
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
              selectedCampaignFromUrl || selectedCampaignId,
              selecteMoodboardId
            );
            galleryActions.addToGallery(galleryItem);
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
              search_keywords: [],
              custom_tags: [],
              moodboard_id: selecteMoodboardId,
              asset_source: "upload",
            };
            galleryActions.addToGallery(galleryItem);
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

  // Get campaigns for the selected brand
  const selectedBrandCampaigns = selectedBrand?.campaigns || [];
  const currentCampaign = selectedBrandCampaigns.find(
    (c) => c.id === selectedCampaign
  );

  // If a campaign is selected and we're in folder view, show the gallery
  if (
    galleryView === "folder" &&
    selectedBrand &&
    selectedCampaign &&
    currentCampaign
  ) {
    return (
      <div className="space-y-4">
        {/* Campaign Header */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToCampaigns}
              className="p-1 h-auto"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Folder className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-900">
                {currentCampaign.title}
              </h2>
              <p className="text-xs text-gray-500">
                {selectedBrand.brand_name} •{" "}
                {galleryActions.galleryItems.length} media items
              </p>
            </div>
          </div>
        </div>

        {/* Upload Dropzone for Campaign */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors duration-200 ease-in-out cursor-pointer ${borderColor} ${
            isDragActive ? "bg-purple-50" : "bg-white"
          } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input {...getInputProps()} />
          <div className="flex gap-x-3">
            <Button
              variant="outline"
              className="bg-[#636AE8] hover:bg-[#636AE8] hover:text-white text-white mb-2"
              disabled={isUploading}
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
                  disabled={isUploading}
                  className="mb-2 border-[#636AE8] text-[#636AE8] hover:bg-[#636AE8] hover:text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link className="mr-2 h-4 w-4" />
                  Add URLs
                </Button>
              </DialogTrigger>

              <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
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

          <p className="text-sm text-gray-500">
            {isDragActive
              ? "Drop media here to upload"
              : `${currentConfig.placeholder} or add URLs`}{" "}
            ({currentConfig.text})
            <span className="block text-xs text-purple-600 mt-1">
              Files will be added to {currentCampaign.title}
            </span>
          </p>

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

        {/* Gallery Status Display */}
        <MediaGalleryStatusDisplay
          galleryStatus={galleryActions.galleryStatus}
          galleryItemsLength={galleryActions.galleryItems.length}
        />

        {/* Gallery Items */}
        {galleryActions.galleryStatus === "success" &&
          galleryActions.galleryItems.length > 0 && (
            <div>
              <MediaGrid
                selectedItems={selectedItems}
                onSelect={handleSelect}
                galleryActions={galleryActions}
              />

              {/* Infinite scroll loading indicator */}
              {galleryActions.hasNextPage && (
                <div
                  ref={ref}
                  className="flex justify-center items-center py-8"
                >
                  {galleryActions.isFetchingNextPage ? (
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  ) : (
                    <p className="text-sm text-gray-500">Load more</p>
                  )}
                </div>
              )}
            </div>
          )}

        {selectedItems.length > 0 && (
          <MediaBulkActions
            selectedItems={selectedItemsData}
            onUnselectAll={handleUnselectAll}
            galleryActions={galleryActions}
          />
        )}
      </div>
    );
  }

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
        <div
          className="flex z-20 justify-start absolute top-3 left-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-52">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                {brandsLoading || brands.length < 0 ? (
                  <Skeleton className="w-full h-9 rounded-md" />
                ) : (
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between text-xs pt-2 hover:bg-white"
                  >
                    {selectedBrand
                      ? selectedBrand.brand_name
                      : "Select brand..."}
                    {open ? (
                      <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    ) : (
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                  </Button>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0">
                <Command>
                  <CommandInput placeholder="Search brands..." />
                  <CommandEmpty>No brand found.</CommandEmpty>
                  <CommandGroup className="max-h-44 overflow-y-scroll">
                    {brands.map((brand) => (
                      <CommandItem
                        key={brand.brand_id}
                        value={`${brand.brand_name} - ${brand.brand_id}`}
                        onSelect={(currentValue) => {
                          // Extract brand name and id from the value
                          const [name, id] = currentValue.split(" - ");
                          const foundBrand = brands.find(
                            (b) =>
                              b.brand_name.toLowerCase() ===
                                name.toLowerCase() && String(b.brand_id) === id
                          );
                          if (setSelectedBrand) {
                            setSelectedBrand(foundBrand || null);
                          }
                          // Reset campaign selection when brand changes
                          setSelectedCampaignFromUrl("");
                          setSelectedCampaign(null);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedBrand?.brand_id === brand.brand_id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {brand.brand_name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
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
              onPointerDownOutside={(e) => e.preventDefault()}
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
            {selectedBrand && (
              <span className="block text-xs text-purple-600 mt-1">
                Files will be added to {selectedBrand.brand_name}
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

      {/* Campaigns List - Show when brand is selected but no campaign is selected and in folder view */}
      {galleryView === "folder" && selectedBrand && !selectedCampaign && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedBrand.brand_name} Campaigns
            </h3>
            <p className="text-sm text-gray-500">
              {selectedBrandCampaigns.length} campaigns
            </p>
          </div>

          {selectedBrandCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedBrandCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onSelect={(campaignId: string) =>
                    handleCampaignSelect(campaignId)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No campaigns found for this brand</p>
            </div>
          )}
        </div>
      )}

      {/* Gallery Grid View - Show when not in folder view or when no brand/campaign is selected */}
      {(galleryView === "grid" ||
        !selectedBrand ||
        (galleryView === "folder" && !selectedCampaign)) && (
        <>
          <MediaGalleryStatusDisplay
            galleryStatus={galleryActions.galleryStatus}
            galleryItemsLength={galleryActions.galleryItems.length}
          />

          {galleryActions.galleryStatus === "success" &&
            galleryActions.galleryItems.length > 0 && (
              <div>
                <MediaGrid
                  selectedItems={selectedItems}
                  onSelect={handleSelect}
                  galleryActions={galleryActions}
                />

                {/* Infinite scroll loading indicator */}
                {galleryActions.hasNextPage && (
                  <div
                    ref={ref}
                    className="flex justify-center items-center py-8"
                  >
                    {galleryActions.isFetchingNextPage ? (
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    ) : (
                      <p className="text-sm text-gray-500">Load more</p>
                    )}
                  </div>
                )}
              </div>
            )}
          {selectedItems.length > 0 && (
            <MediaBulkActions
              selectedItems={selectedItemsData}
              onUnselectAll={handleUnselectAll}
              galleryActions={galleryActions}
            />
          )}
        </>
      )}
    </div>
  );
}
