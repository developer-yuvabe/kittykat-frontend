import {
  FileWithStatus,
  GalleryFilters,
  GalleryItem,
} from "@/types/gallery.types";
import { CheckCircle, Loader2, X, File } from "lucide-react";
import React from "react";

export const acceptedFileTypes = {
  images: {
    types: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/svg+xml": [".svg"],
    },
    text: "PNG, JPEG, JPG, SVG",
    placeholder: "Drop images here to upload",
    assetType: "image",
  },
  videos: {
    types: {
      "video/mp4": [".mp4"],
      "video/quicktime": [".mov"],
      "video/x-msvideo": [".avi"],
    },
    text: "MP4, MOV, AVI",
    placeholder: "Drop videos here to upload",
    assetType: "video",
  },
  models: {
    types: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/svg+xml": [".svg"],
    },
    text: "PNG, JPEG, JPG, SVG",
    placeholder: "Drop model images here to upload",
    assetType: "image",
  },
  products: {
    types: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "model/gltf-binary": [".glb"],
    },
    text: "JPG, PNG, GLB",
    placeholder: "Drop product images or models here",
    assetType: "model",
  },
  moodboards: {
    types: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/svg+xml": [".svg"],
    },
    text: "Images only",
    placeholder: "Drop moodboard images here",
    assetType: "image",
  },
};

// Helper function to determine asset type from file
export const getAssetTypeFromFile = (file: File): string => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "image"; // fallback
};

// Helper function to get file dimensions (for images)
export const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number } | null> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(null);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
};

// Helper function to create gallery item from uploaded file
export const createGalleryItemFromFile = async (
  file: File,
  url: string,
  galleryFilters: GalleryFilters,
  activeTab: string,
  brandId: string
): Promise<GalleryItem> => {
  const dimensions = await getImageDimensions(file);
  const assetType = getAssetTypeFromFile(file);

  // Calculate aspect ratio if dimensions are available
  const aspectRatio = dimensions
    ? `${dimensions.width}:${dimensions.height}`
    : undefined;

  const galleryItem: GalleryItem = {
    // Basic Asset Info
    asset_type: assetType,
    asset_source: galleryFilters.source ?? "upload", // or "brands" depending on your system
    asset_title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
    asset_url: url,
    size: formatBytes(file.size),
    aspect_ratio: aspectRatio,
    media_format: file.type,
    brand_id: brandId,

    // Versioning
    related_asset_ids: [],

    // AI & Generation Info
    prompt_modifiers: [],
    ai_tags: [],
    visual_style_tags: [],
    detected_objects: [],
    detected_emotions: [],
    detected_colors: [],

    // Tagging & Classification
    intent_tags: [activeTab], // Use the active tab as an intent tag
    search_keywords: [file.name.toLowerCase()],
    custom_tags: [],

    // Asset Management
    is_favourite: false,
    is_archived: false,

    // System Metadata
    processing_status: "ready",
  };

  return galleryItem;
};

// Helper function to format bytes
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getStatusIcon = (status: FileWithStatus["status"]) => {
  switch (status) {
    case "uploading":
      return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
    case "success":
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    case "error":
      return <X className="h-3 w-3 text-red-500" />;
    default:
      return <File className="h-3 w-3 text-gray-400" />;
  }
};

export const getStatusColor = (status: FileWithStatus["status"]) => {
  switch (status) {
    case "uploading":
      return "text-blue-600";
    case "success":
      return "text-green-600";
    case "error":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
};
