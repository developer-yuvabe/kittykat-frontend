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
import type {
  GalleryFilters,
  FileWithStatus,
  BrandCampaignListResponse,
} from "@/types/gallery.types";
import {
  acceptedFileTypes,
  createGalleryItemFromFile,
  getStatusColor,
  getStatusIcon,
} from "@/lib/gallery.utils";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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
}: UploadDropzoneProps) {
  console.log("brands", brands);

  const [filesWithStatus, setFilesWithStatus] = useState<FileWithStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [open, setOpen] = useState(false);

  // Use gallery hook to get addToGallery mutation
  console.log("dzone", galleryFilters);
  const { addToGallery: addToGalleryMutation } =
    useGalleryQuery(galleryFilters);

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

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    const newFilesWithStatus: FileWithStatus[] = files.map((file) => ({
      file,
      status: "pending",
    }));

    setFilesWithStatus((prev) => [...prev, ...newFilesWithStatus]);

    const uploadPromises = files.map(async (file, index) => {
      const fileIndex = filesWithStatus.length + index;

      try {
        // Update status to uploading
        setFilesWithStatus((prev) =>
          prev.map((item, idx) =>
            idx === fileIndex ? { ...item, status: "uploading" } : item
          )
        );

        const url = await uploadFileAndReturnUrl(
          file.name,
          file.type,
          "brands",
          file
        );

        // Update status to success
        setFilesWithStatus((prev) =>
          prev.map((item, idx) =>
            idx === fileIndex ? { ...item, status: "success", url } : item
          )
        );

        // Add to gallery if enabled
        if (addToGallery && selectedBrand) {
          try {
            const galleryItem = await createGalleryItemFromFile(
              file,
              url,
              galleryFilters,
              source,
              selectedBrand?.brand_id
            );
            addToGalleryMutation(galleryItem);
          } catch (galleryError) {
            console.warn("Failed to add to gallery:", galleryError);
            // Don't fail the upload if gallery addition fails
          }
        }

        return url;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";

        // Update status to error
        setFilesWithStatus((prev) =>
          prev.map((item, idx) =>
            idx === fileIndex
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
        const successMessage = addToGallery
          ? `${successfulUrls.length} file${
              successfulUrls.length > 1 ? "s" : ""
            } uploaded and added to gallery`
          : `${successfulUrls.length} file${
              successfulUrls.length > 1 ? "s" : ""
            } uploaded successfully`;

        toast.success(successMessage, {
          description: files
            .slice(0, successfulUrls.length)
            .map((file) => file.name)
            .join(", "),
          duration: 3000,
        });

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

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        uploadFiles(acceptedFiles);
      }
    },
    [uploadFiles, activeTab]
  );

  const removeFile = (index: number) => {
    setFilesWithStatus((prev) => prev.filter((_, idx) => idx !== index));
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
        <div
          className="flex z-20 justify-start absolute top-3 left-2 "
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
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
          {brands.length === 0 && !brandsLoading ? (
            <p className="text-sm pt-2 text-gray-500">
              Set up a brand to get started
            </p>
          ) : (
            <p className="text-sm pt-2 text-gray-500">
              {isDragActive
                ? "or drop media here to upload"
                : `${currentConfig.placeholder}`}{" "}
              ({currentConfig.text})
              {addToGallery && (
                <span className="block text-xs text-purple-600 mt-1">
                  Files will be added to brand gallery
                </span>
              )}
            </p>
          )}
        </div>

        {filesWithStatus.length > 0 && (
          <div className="mt-4 w-full max-w-md">
            <p className="text-xs font-medium text-gray-700 mb-1">Files:</p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {filesWithStatus.map((fileWithStatus, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between text-xs py-2 px-3 rounded-md border ${
                    fileWithStatus.status === "error"
                      ? "bg-red-50 border-red-200"
                      : fileWithStatus.status === "success"
                      ? "bg-green-50 border-green-200"
                      : fileWithStatus.status === "uploading"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center min-w-0 flex-1">
                    {getStatusIcon(fileWithStatus.status)}
                    <span
                      className={`ml-2 truncate ${getStatusColor(
                        fileWithStatus.status
                      )}`}
                    >
                      {fileWithStatus.file.name}
                    </span>
                  </div>
                  <div className="flex items-center ml-2">
                    {fileWithStatus.status === "error" && (
                      <span
                        className="text-xs text-red-500 mr-2"
                        title={fileWithStatus.error}
                      >
                        Failed
                      </span>
                    )}
                    {fileWithStatus.status === "success" &&
                      fileWithStatus.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto text-xs text-blue-500 hover:text-blue-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(fileWithStatus.url!);
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
                        removeFile(index);
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
