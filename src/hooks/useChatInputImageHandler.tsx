import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { getExtensionFromUrl } from "@/lib/utils";
import { GalleryItem } from "@/types/gallery.types";
import { useGalleryQuery } from "./useGallery";
import { useReferenceImagesStore } from "@/store/reference-image.store";
import { allMediaAssetSources } from "@/lib/gallery.utils";

interface UseChatInputImageHandlerOptions {
  brandId: string | null;
  referenceImages: string[];
  onReferenceImagesChange: (urls: string[]) => void;
  maxTotalSizeMB: number;
  maxFileSizeLimit: number;
  allowedFileTypes: string[];
  maxImageCount: number;
}

interface UploadResult {
  uploadedUrls: string[];
  rejectedCount: number;
  totalSizeMB: number;
}

export function useChatInputImageHandler({
  brandId,
  referenceImages,
  onReferenceImagesChange,
  maxTotalSizeMB,
  maxFileSizeLimit,
  allowedFileTypes,
  maxImageCount,
}: UseChatInputImageHandlerOptions) {
  const [isUploading, setIsUploading] = useState(false);

  const { bulkUpload } = useGalleryQuery(
    {
      selectedFilters: {
        brands: [brandId!],
        campaigns: [],
        moodboards: [],
        product_categories: [],
        asset_types: [],
        asset_sources: [...allMediaAssetSources, "reference"],
        media_format: [],
        aspect_ratio: [],
        workflow_status: [],
        sort_by: "last_accessed_at",
      },
    },
    40,
    true
  );

  const { addItems } = useReferenceImagesStore();

  // Validate file type
  const isValidFileType = useCallback(
    (file: File): boolean => {
      return allowedFileTypes.includes(file.type);
    },
    [allowedFileTypes]
  );

  // Get file size in MB
  const getFileSizeInMB = useCallback((file: File): number => {
    return file.size / (1024 * 1024);
  }, []);

  // Check if file size is within limit
  const isValidFileSize = useCallback(
    (file: File): boolean => {
      const sizeMB = getFileSizeInMB(file);
      return sizeMB <= maxFileSizeLimit;
    },
    [maxFileSizeLimit, getFileSizeInMB]
  );

  // Validate and filter files based on constraints
  const validateAndFilterFiles = useCallback(
    async (
      files: File[]
    ): Promise<{
      validFiles: File[];
      invalidTypeFiles: string[];
      oversizedFiles: string[];
      remainingSlots: number;
    }> => {
      const validFiles: File[] = [];
      const invalidTypeFiles: string[] = [];
      const oversizedFiles: string[] = [];
      const remainingSlots = maxImageCount - referenceImages.length;

      for (const file of files) {
        // Check file type
        if (!isValidFileType(file)) {
          invalidTypeFiles.push(file.name);
          continue;
        }

        // Check file size
        if (!isValidFileSize(file)) {
          const sizeMB = getFileSizeInMB(file);
          oversizedFiles.push(`${file.name} (${sizeMB.toFixed(1)}MB)`);
          continue;
        }

        // Check remaining slots
        if (validFiles.length >= remainingSlots) {
          break;
        }

        validFiles.push(file);
      }

      return { validFiles, invalidTypeFiles, oversizedFiles, remainingSlots };
    },
    [
      maxImageCount,
      referenceImages.length,
      isValidFileType,
      isValidFileSize,
      getFileSizeInMB,
    ]
  );

  // Truncate files based on total size limit
  const truncateFilesByTotalSize = useCallback(
    async (
      files: File[]
    ): Promise<{
      validFiles: File[];
      rejectedCount: number;
      totalSizeMB: number;
    }> => {
      const validFiles: File[] = [];
      let currentTotalSizeMB = 0;
      let rejectedCount = 0;

      for (const file of files) {
        const fileSizeMB = getFileSizeInMB(file);

        if (currentTotalSizeMB + fileSizeMB <= maxTotalSizeMB) {
          validFiles.push(file);
          currentTotalSizeMB += fileSizeMB;
        } else {
          rejectedCount++;
        }
      }

      return { validFiles, rejectedCount, totalSizeMB: currentTotalSizeMB };
    },
    [maxTotalSizeMB, getFileSizeInMB]
  );

  // Upload files to storage and gallery
  const uploadFilesToGallery = useCallback(
    async (files: File[]): Promise<UploadResult> => {
      if (!brandId) {
        throw new Error("Brand ID is required for uploading files");
      }

      const uploadedGalleryItems: GalleryItem[] = [];
      const uploadedUrls: string[] = [];

      // Upload files to storage
      const uploadPromises = files.map(async (file) => {
        try {
          const uploadedUrl = await uploadFileAndReturnUrl(
            file.name,
            file.type,
            "brands",
            file,
            brandId
          );

          uploadedGalleryItems.push({
            brand_id: brandId,
            asset_type: "image",
            asset_source: "reference",
            asset_title: file.name,
            asset_url: uploadedUrl,
            preview_url: uploadedUrl,
            media_format: getExtensionFromUrl(uploadedUrl),
            is_master: true,
            size: "",
            last_accessed_at: new Date().toISOString(),
          });

          uploadedUrls.push(uploadedUrl);
          return uploadedUrl;
        } catch (error) {
          console.error("Upload failed for", file.name, error);
          throw error;
        }
      });

      await Promise.all(uploadPromises);

      if (uploadedGalleryItems.length === 0) {
        throw new Error("No files were uploaded successfully");
      }

      // Save to gallery backend
      const response = await bulkUpload({
        gallery_items: uploadedGalleryItems,
        brand_id: brandId,
      });

      // Add uploaded items to gallery store
      if (response && response.length > 0) {
        addItems(response);
      }

      return {
        uploadedUrls,
        rejectedCount: 0,
        totalSizeMB: files.reduce((sum, f) => sum + getFileSizeInMB(f), 0),
      };
    },
    [brandId, bulkUpload, addItems, getFileSizeInMB]
  );

  // Main handler for processing and uploading files
  const handleImageFiles = useCallback(
    async (files: File[]): Promise<void> => {
      if (!brandId) {
        toast.error("Brand context is required for uploading images");
        return;
      }

      if (files.length === 0) {
        return;
      }

      setIsUploading(true);

      try {
        // Step 1: Validate file types and sizes
        const { validFiles, invalidTypeFiles, oversizedFiles, remainingSlots } =
          await validateAndFilterFiles(files);

        // Show warnings for invalid files
        if (invalidTypeFiles.length > 0) {
          toast.warning(
            `${
              invalidTypeFiles.length
            } file(s) rejected: Invalid file type. Allowed: ${allowedFileTypes.join(
              ", "
            )}`
          );
        }

        if (oversizedFiles.length > 0) {
          toast.warning(
            `${oversizedFiles.length} file(s) rejected: Size exceeds ${maxFileSizeLimit}MB limit`
          );
        }

        if (remainingSlots <= 0) {
          toast.error(`Maximum ${maxImageCount} images allowed`);
          return;
        }

        if (validFiles.length === 0) {
          if (invalidTypeFiles.length === 0 && oversizedFiles.length === 0) {
            toast.info("No valid images to upload");
          }
          return;
        }

        // Step 2: Truncate files by total size limit
        const { validFiles: truncatedFiles, rejectedCount } =
          await truncateFilesByTotalSize(validFiles);

        if (rejectedCount > 0) {
          toast.warning(
            `${rejectedCount} file(s) skipped to stay within ${maxTotalSizeMB}MB total size limit`
          );
        }

        if (truncatedFiles.length === 0) {
          toast.error("No files could be added within the size limit");
          return;
        }

        // Step 3: Upload files
        const uploadPromise = uploadFilesToGallery(truncatedFiles);

        const toastPromise = toast.promise(uploadPromise, {
          loading: `Uploading ${truncatedFiles.length} image(s)...`,
          success: (result) =>
            `${result.uploadedUrls.length} image(s) uploaded successfully`,
          error: "Failed to upload images. Please try again.",
        });

        const result = await toastPromise.unwrap();

        // Step 4: Add to reference images
        onReferenceImagesChange([...referenceImages, ...result.uploadedUrls]);
      } catch (error) {
        console.error("Image upload failed:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [
      brandId,
      validateAndFilterFiles,
      truncateFilesByTotalSize,
      uploadFilesToGallery,
      onReferenceImagesChange,
      referenceImages,
      allowedFileTypes,
      maxFileSizeLimit,
      maxImageCount,
      maxTotalSizeMB,
    ]
  );

  // Handle paste event
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];

      // Extract image files from clipboard
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        await handleImageFiles(imageFiles);
      }
    },
    [handleImageFiles]
  );

  // Set up paste event listener on document
  useEffect(() => {
    document.addEventListener("paste", handlePaste as any);

    return () => {
      document.removeEventListener("paste", handlePaste as any);
    };
  }, [handlePaste]);

  return {
    isUploading,
    handleImageFiles,
  };
}
