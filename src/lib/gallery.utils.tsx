import {
  EnhancedSelectedFilters,
  FileWithStatus,
  GalleryFilters,
  GalleryItem,
  GalleryItemResponse,
  WorkflowStatus,
} from "@/types/gallery.types";
import { CheckCircle, Loader2, X, File } from "lucide-react";
import React from "react";

export const acceptedFileTypes = {
  images: {
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
      "image/vnd.adobe.photoshop": [".psd"],
    },
    text: "PNG, JPEG, JPG, SVG, MP4, MOV, AVI, TIFF, WEBP, BMP, GIF, PSD",
    placeholder: "Drop images or videos here to upload",
    assetType: "image", // Default, overridden by getAssetTypeFromFile
  },
  videos: {
    types: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/svg+xml": [".svg"],
      "video/mp4": [".mp4"],
      "video/quicktime": [".mov"],
      "video/x-msvideo": [".avi"],
    },
    text: "PNG, JPEG, JPG, SVG, MP4, MOV, AVI",
    placeholder: "Drop images or videos here to upload",
    assetType: "video", // Default, overridden by getAssetTypeFromFile
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

// Helper function to determine asset type from URL
export const getAssetTypeFromUrl = async (url: string) => {
  const extension = url.split(".").pop()?.split(/#|\?/)[0]?.toLowerCase();
  if (["mp4", "mov", "avi", "webm"].includes(extension || "")) return "video";
  if (["png", "jpg", "jpeg", "svg", "gif", "webp"].includes(extension || ""))
    return "image";

  const response = await fetch(url);
  const blob = await response.blob();
  return getAssetTypeFromBlob(blob);
};

export const getAssetTypeFromUrlCooked = (url: string) => {
  const extension = url.split(".").pop()?.split(/#|\?/)[0]?.toLowerCase();
  if (["mp4", "mov", "avi", "webm"].includes(extension || "")) return "video";
  if (["png", "jpg", "jpeg", "svg", "gif", "webp"].includes(extension || ""))
    return "image";

  return "image";
};

async function getAssetTypeFromBlob(blob: Blob) {
  const mimeType = blob.type;
  if (!mimeType) throw new Error("Unable to determine MIME type from blob");

  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";

  throw new Error("Unsupported MIME type: " + mimeType);
}

// Helper function to create gallery item from uploaded file
export const createGalleryItemFromFile = async (
  file: File,
  url: string,
  galleryFilters: GalleryFilters,
  activeTab: string,
  brandId: string,
  campaignId?: string,
  moodboardId?: string
): Promise<GalleryItem> => {
  const assetType = getAssetTypeFromFile(file);

  // Calculate aspect ratio if dimensions are available

  const galleryItem: GalleryItem = {
    // Basic Asset Info
    asset_type: "image" === assetType ? "image" : "video",
    asset_source: activeTab,
    asset_title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
    asset_url: url,
    size: formatBytes(file.size),
    media_format: getSafeMediaFormat(file),
    brand_id: brandId,
    // Versioning
    related_asset_ids: [],

    campaign_id: campaignId,
    moodboard_id: moodboardId,

    // AI & Generation Info
    prompt_modifiers: [],
    ai_tags: [],
    visual_style_tags: {},
    detected_objects: [],
    detected_emotions: [],
    detected_colors: [],

    // Tagging & Classification
    search_keywords: [file.name.toLowerCase()],
    custom_tags: [],

    // Asset Management
    is_favourite: false,
    is_archived: false,
    is_master: true,

    ...(activeTab === "a2i-media"
      ? {
          sent_to_human_queue: true,
          workflow_status: "in_review",
        }
      : {}),

    // System Metadata
    processing_status: "ready",
  };

  return galleryItem;
};

// Helper function to get image dimensions from URL (if you need it separately)

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
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
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
  { value: "avi", label: "AVI" },
  { value: "tiff", label: "TIFF" },
  { value: "svg", label: "SVG" },
  { value: "bmp", label: "BMP" },
  { value: "psd", label: "PSD" },
];

export const ASPECT_RATIO_OPTIONS = [
  { value: "1:1", label: "Square (1:1)" },
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
  { value: "4:3", label: "Standard (4:3)" },
  { value: "3:4", label: "Portrait (3:4)" },
  { value: "21:9", label: "Ultra Wide (21:9)" },
];

export const WORKFLOW_STATUS_OPTIONS: {
  value: WorkflowStatus;
  label: string;
  dotColor: string;
}[] = [
  { value: "draft", label: "Draft", dotColor: "bg-gray-500" },
  {
    value: "request_created",
    label: "Request Created",
    dotColor: "bg-orange-600",
  },
  {
    value: "in_progress",
    label: "Editing in progress",
    dotColor: "bg-blue-600",
  },
  { value: "in_review", label: "Awaiting Approval", dotColor: "bg-purple-600" },
  { value: "approved", label: "Approved", dotColor: "bg-green-600" },
  {
    value: "requested_revision",
    label: "Requested Revision",
    dotColor: "bg-red-600",
  },
  {
    value: "a2i_media_created",
    label: "A2I Media Created",
    dotColor: "bg-yellow-600",
  },
];

export const WORKFLOW_STATUS_MAP = WORKFLOW_STATUS_OPTIONS.reduce(
  (acc, curr) => {
    acc[curr.value] = curr;
    return acc;
  },
  {} as Record<WorkflowStatus, { label: string; dotColor: string }>
);

// Calculate active filters count
export const getActiveFiltersCount = (filters: EnhancedSelectedFilters) => {
  let count = 0;
  if (filters?.brands?.length > 0) count += filters.brands.length;
  if (filters?.campaigns?.length > 0) count += filters.campaigns.length;
  if (filters?.product_categories?.length > 0)
    count += filters.product_categories.length;
  if (filters?.asset_types?.length > 0) count += filters.asset_types.length;
  if (filters?.media_format?.length > 0) count += filters.media_format.length;
  if (filters?.aspect_ratio?.length > 0) count += filters.aspect_ratio.length;
  if (filters?.workflow_status.length > 0)
    count += filters.workflow_status.length;
  if (filters?.has_product === true) count++;
  if (filters?.has_people === true) count++;
  if (filters?.has_lifestyle_context === true) count++;
  if (filters?.is_favourite === true) count++;
  if (filters?.is_archived === true) count++;
  return count;
};

const allowedFormats = MEDIA_FORMAT_OPTIONS.map((opt) => opt.value);

export const getSafeMediaFormat = (file: File): string => {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && allowedFormats.includes(ext)) return ext;

  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/tiff": "tiff",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
    "image/svg+xml": "svg",
    "image/bmp": ".bmp",
    "image/vnd.adobe.photoshop": "psd",
  };

  const fallback = mimeToExt[file.type];
  return allowedFormats.includes(fallback) ? fallback : "unknown";
};
/// <reference lib="dom" />
import { UseMutateFunction, MutateOptions } from "@tanstack/react-query";

// Types
type GalleryActions = {
  patchItem: UseMutateFunction<
    GalleryItemResponse,
    Error,
    { itemId: string; data: Partial<GalleryItem> },
    { queryKey: (string | boolean | EnhancedSelectedFilters | undefined)[] }
  >;

  addComment: UseMutateFunction<
    void | GalleryItemResponse,
    Error,
    {
      itemId: string;
      commentData: { text: string; attachments?: string[] | undefined };
    },
    unknown
  >;

  updateComment: UseMutateFunction<
    void | GalleryItemResponse,
    Error,
    { itemId: string; commentId: string; commentData: { text: string } },
    unknown
  >;

  deleteComment: UseMutateFunction<
    { id: string },
    Error,
    { itemId: string; commentId: string },
    unknown
  >;

  bulkDelete: (
    variables: string[],
    options?: MutateOptions<
      { id: string }[],
      Error,
      string[],
      {
        previousData: unknown;
        queryKey: (string | boolean | EnhancedSelectedFilters | undefined)[];
      }
    >
  ) => void;

  deleteItem: (
    variables: string,
    options?: MutateOptions<
      { id: string },
      Error,
      string,
      {
        previousData: unknown;
        queryKey: (string | boolean | EnhancedSelectedFilters | undefined)[];
      }
    >
  ) => void;
};

// Helper Class
class MediaItemHelper {
  constructor(private actions: GalleryActions) {}

  editTitle = async (itemId: string, newTitle: string): Promise<void> => {
    this.actions.patchItem({
      itemId,
      data: { asset_title: newTitle },
    });
  };

  addComment = async (
    itemId: string,
    text: string,
    attachments?: string[]
  ): Promise<void> => {
    this.actions.addComment({
      itemId,
      commentData: { text, attachments },
    });
  };

  updateComment = async (
    itemId: string,
    commentId: string,
    text: string
  ): Promise<void> => {
    this.actions.updateComment({
      itemId,
      commentId,
      commentData: { text },
    });
  };

  deleteComment = async (itemId: string, commentId: string): Promise<void> => {
    this.actions.deleteComment({
      itemId,
      commentId,
    });
  };

  bulkDelete = (
    itemIds: string[],
    options?: Parameters<GalleryActions["bulkDelete"]>[1]
  ): void => {
    this.actions.bulkDelete(itemIds, options);
  };

  deleteItem = (
    itemId: string,
    options?: Parameters<GalleryActions["deleteItem"]>[1]
  ): void => {
    this.actions.deleteItem(itemId, options);
  };
}

// Factory function
export const createMediaItemHelper = (
  actions: GalleryActions
): MediaItemHelper => {
  return new MediaItemHelper(actions);
};

export const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export async function batchExecute<T>(
  items: T[],
  handler: (item: T) => Promise<any>,
  options?: {
    parallel?: boolean;
    onProgress?: (completed: number, total: number) => void;
  }
) {
  const { parallel = false, onProgress } = options || {};
  const total = items.length;
  let completed = 0;

  if (parallel) {
    const results = await Promise.all(
      items.map(async (item) => {
        const res = await handler(item);
        completed++;
        onProgress?.(completed, total);
        return res;
      })
    );
    return results;
  } else {
    const results: any[] = [];
    for (const item of items) {
      const res = await handler(item);
      results.push(res);
      completed++;
      onProgress?.(completed, total);
    }
    return results;
  }
}
