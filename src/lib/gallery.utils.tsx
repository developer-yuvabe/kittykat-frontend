import {
  EnhancedSelectedFilters,
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

export const ASSET_TYPE_OPTIONS = [
  { value: "generated", label: "Generated" },
  { value: "uploaded", label: "Uploaded" },
  { value: "edited", label: "Edited" },
];

export const MEDIA_FORMAT_OPTIONS = [
  { value: "jpg", label: "JPG" },
  { value: "jpeg", label: "JPEG" },
  { value: "png", label: "PNG" },
  { value: "gif", label: "GIF" },
  { value: "webp", label: "WebP" },
  { value: "mp4", label: "MP4" },
  { value: "mov", label: "MOV" },
  { value: "webm", label: "WebM" },
];

export const ASPECT_RATIO_OPTIONS = [
  { value: "1:1", label: "Square (1:1)" },
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
  { value: "4:3", label: "Standard (4:3)" },
  { value: "3:4", label: "Portrait (3:4)" },
  { value: "21:9", label: "Ultra Wide (21:9)" },
];

export const WORKFLOW_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "ready_to_publish", label: "Ready to Publish" },
];

// Calculate active filters count
export const getActiveFiltersCount = (filters: EnhancedSelectedFilters) => {
  let count = 0;
  if (filters.brands.length > 0) count += filters.brands.length;
  if (filters.campaigns.length > 0) count += filters.campaigns.length;
  if (filters.product_categories.length > 0)
    count += filters.product_categories.length;
  if (filters.asset_types.length > 0) count += filters.asset_types.length;
  if (filters.media_format.length > 0) count += filters.media_format.length;
  if (filters.aspect_ratio.length > 0) count += filters.aspect_ratio.length;
  if (filters.workflow_status.length > 0)
    count += filters.workflow_status.length;
  if (filters.has_product === true) count++;
  if (filters.has_people === true) count++;
  if (filters.has_lifestyle_context === true) count++;
  if (filters.is_favourite === true) count++;
  if (filters.is_archived === true) count++;
  return count;
};
