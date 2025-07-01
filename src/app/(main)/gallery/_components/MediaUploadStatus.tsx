import React from "react";
import type { MediaWithStatus } from "@/types/gallery.types";
import { MediaUploadFileList } from "./MediaUploadFileList";

interface MediaUploadStatusProps {
  brands: any[];
  brandsLoading: boolean;
  isDragActive: boolean;
  currentConfig: {
    placeholder: string;
    text: string;
  };
  addToGallery: boolean;
  mediaWithStatus: MediaWithStatus[];
  onRemoveItem: (index: number) => void;
}

export function MediaUploadStatus({
  brands,
  brandsLoading,
  isDragActive,
  currentConfig,
  addToGallery,
  mediaWithStatus,
  onRemoveItem,
}: MediaUploadStatusProps) {
  if (brands.length === 0 && !brandsLoading) {
    return (
      <p className="text-sm text-gray-500">Set up a brand to get started</p>
    );
  }

  return (
    <>
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

      {mediaWithStatus.length > 0 && (
        <MediaUploadFileList
          mediaWithStatus={mediaWithStatus}
          onRemoveItem={onRemoveItem}
        />
      )}
    </>
  );
}
