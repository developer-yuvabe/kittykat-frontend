import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Images, Paperclip, PanelTop } from "lucide-react";
import { useCallback, useState, useEffect, useMemo } from "react";
import { FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { useBrandStore } from "@/store/brand.store";
import { useGalleryQuery } from "@/hooks/useGallery";
import { getExtensionFromUrl } from "@/lib/utils";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { GalleryItem, GalleryItemResponse } from "@/types/gallery.types";
import { useReferenceImagesStore } from "@/store/reference-image.store";
import { MediaLibraryDialog } from "@/components/shared/MediaLibraryDialog";
import { ReferenceUploadArea } from "./ReferenceUploadArea";
import { ReferenceZone } from "./ReferenceZone";
import { ReferenceGalleryGrid } from "./ReferenceGalleryGrid";
import { allMediaAssetSources, checkFileSizeLimit } from "@/lib/gallery.utils";
import {
  handleReferenceImageDrop,
  addReferenceToZone,
  removeReferenceFromZone,
} from "@/lib/reference-image.utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReferenceImageSelectorProps {
  // Single-zone mode (for ChatInput)
  referenceImages?: string[];
  onReferenceImagesChange?: (urls: string[]) => void;

  // Dual-zone mode (for A2I)
  masterReference?: string[];
  productReference?: string[];
  onMasterReferenceChange?: (urls: string[]) => void;
  onProductReferenceChange?: (urls: string[]) => void;
  activeTab?: "master" | "product";
  onTabChange?: (tab: "master" | "product") => void;
  isMagicEnabled?: boolean;
  onToggleMagic?: () => void;

  // Common props
  maxLimit: number;
  fileTypes: string[];
  maxFileSizeLimit: number;
  maxTotalSizeMB?: number;
  disabled?: boolean;
  currentCampaignId?: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;

  // UX Mode props
  variant?: "popover" | "inline" | "hidden"; // Controls the layout/UX
  popoverAlign?: "start" | "center" | "end";
  popoverSide?: "top" | "bottom" | "left" | "right";
  customTrigger?: React.ReactNode;
  showPopoverTrigger?: boolean;
}

const ReferenceImageSelector = ({
  // Single-zone props
  referenceImages,
  onReferenceImagesChange,

  // Dual-zone props
  masterReference: masterReferenceProp,
  productReference: productReferenceProp,
  onMasterReferenceChange: onMasterReferenceChangeProp,
  onProductReferenceChange: onProductReferenceChangeProp,
  activeTab: activeTabProp,
  onTabChange: onTabChangeProp,
  isMagicEnabled,
  onToggleMagic,

  // Common props
  maxLimit,
  fileTypes,
  maxFileSizeLimit,
  maxTotalSizeMB,
  disabled = false,
  currentCampaignId,
  isOpen,
  onOpenChange,

  // UX Mode props
  variant = "popover",
  popoverAlign = "start",
  popoverSide = "top",
  customTrigger,
  showPopoverTrigger = true,
}: ReferenceImageSelectorProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  // Map URLs to gallery IDs for tracking pre-selected items
  const [urlToIdMap, setUrlToIdMap] = useState<Map<string, string>>(new Map());

  // Determine mode based on whether product reference props are provided
  const isSingleMode = !onProductReferenceChangeProp;
  const isInlineMode = variant === "inline";

  // Use master reference for single mode, or separate references for dual mode
  const masterReference = isSingleMode
    ? referenceImages || []
    : masterReferenceProp || [];
  const productReference = isSingleMode ? [] : productReferenceProp || [];
  const activeTab = activeTabProp || "master";

  const onMasterReferenceChange = isSingleMode
    ? (urls: string[]) => onReferenceImagesChange?.(urls)
    : onMasterReferenceChangeProp || (() => {});

  const onProductReferenceChange = isSingleMode
    ? () => {}
    : onProductReferenceChangeProp || (() => {});

  const onTabChange = onTabChangeProp || (() => {});

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && mediaLibraryOpen) {
        return;
      }
      onOpenChange(open);
    },
    [mediaLibraryOpen, onOpenChange]
  );

  const { selectedBrandId } = useBrandStore();

  const { bulkUpload, patchItem, getGalleryItems, isFetching, deleteItem } =
    useGalleryQuery(
      {
        selectedFilters: {
          brands: [selectedBrandId!],
          campaigns: [],
          moodboards: [],
          product_categories: [],
          asset_types: ["image"],
          asset_sources: [...allMediaAssetSources, "reference"],
          media_format: [],
          aspect_ratio: [],
          workflow_status: [],
          sort_by: "last_accessed_at",
        },
        assetType: "reference",
      },
      40,
      true,
      undefined,
      false
    );

  const {
    items: galleryItems,
    isLoading: isLoadingStore,
    updateLastAccessed,
    addItems,
    setItems,
    setIsLoading,
  } = useReferenceImagesStore();

  const currentImageCount = masterReference.length + productReference.length;
  const remainingSlots = maxLimit - currentImageCount;

  // Use URL-to-ID map for pre-selected tracking in MediaLibraryDialog
  const selectedGalleryIds = useMemo(() => {
    const ids: string[] = [];
    [...masterReference, ...productReference].forEach((url) => {
      const id = urlToIdMap.get(url);
      if (id) {
        ids.push(id);
      }
    });
    return ids;
  }, [urlToIdMap, masterReference, productReference]);

  const openForMaster = useCallback(() => {
    onTabChange("master");
    handleOpenChange(true);
  }, [onTabChange, handleOpenChange]);

  const openForProduct = useCallback(() => {
    onTabChange("product");
    handleOpenChange(true);
  }, [onTabChange, handleOpenChange]);

  // Fetch reference images when component mounts or brand changes
  useEffect(() => {
    if (selectedBrandId && !isFetching) {
      setItems(getGalleryItems());
    }
    setIsLoading(isFetching);
  }, [selectedBrandId, isFetching]);

  // Helper function to get file size in MB
  const getFileSizeInMB = async (file: File): Promise<number> => {
    return file.size / (1024 * 1024);
  };

  // Helper function to truncate files based on total size limit
  const truncateFilesByTotalSize = useCallback(
    async (
      files: File[]
    ): Promise<{ validFiles: File[]; rejectedCount: number }> => {
      if (!maxTotalSizeMB) {
        return { validFiles: files, rejectedCount: 0 };
      }

      const validFiles: File[] = [];
      let currentTotalSizeMB = 0;
      let rejectedCount = 0;

      for (const file of files) {
        const fileSizeMB = await getFileSizeInMB(file);

        if (currentTotalSizeMB + fileSizeMB <= maxTotalSizeMB) {
          validFiles.push(file);
          currentTotalSizeMB += fileSizeMB;
        } else {
          rejectedCount++;
        }
      }

      return { validFiles, rejectedCount };
    },
    [maxTotalSizeMB]
  );

  // DRY: Shared upload logic for file drops and uploads
  const uploadFilesAndAddToZone = useCallback(
    async (
      files: File[],
      zone: "master" | "product",
      showToast: boolean = true
    ): Promise<string[]> => {
      // Truncate files if total size limit is set
      const { validFiles, rejectedCount } = await truncateFilesByTotalSize(
        files
      );

      if (rejectedCount > 0 && maxTotalSizeMB) {
        toast.warning(
          `${rejectedCount} file(s) were skipped to stay within the ${maxTotalSizeMB}MB total size limit.`
        );
      }

      if (validFiles.length === 0) {
        if (showToast) {
          toast.error("No files could be added within the size limit");
        }
        return [];
      }

      const uploadedGalleryItems: GalleryItem[] = [];
      const uploadedUrls: string[] = [];

      // Upload files to storage
      const uploadPromises = validFiles.map(async (file) => {
        try {
          const uploadedUrl = await uploadFileAndReturnUrl(
            file.name,
            file.type,
            "brands",
            file,
            selectedBrandId
          );

          uploadedGalleryItems.push({
            brand_id: selectedBrandId!,
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
        if (showToast) {
          toast.error("No files were uploaded successfully");
        }
        return [];
      }

      // Save to gallery backend
      const response = await bulkUpload({
        gallery_items: uploadedGalleryItems,
        brand_id: selectedBrandId!,
      });

      // Add uploaded items to gallery store
      if (response && response.length > 0) {
        addItems(response);
        
        // Update URL-to-ID mapping for uploaded items
        setUrlToIdMap((prev) => {
          const newMap = new Map(prev);
          response.forEach((item) => {
            if (item.id && item.asset_url) {
              newMap.set(item.asset_url, item.id);
            }
          });
          return newMap;
        });
      }

      // Add to references
      if (zone === "master") {
        onMasterReferenceChange([...masterReference, ...uploadedUrls]);
      } else {
        onProductReferenceChange([...productReference, ...uploadedUrls]);
      }

      return uploadedUrls;
    },
    [
      selectedBrandId,
      bulkUpload,
      addItems,
      masterReference,
      productReference,
      onMasterReferenceChange,
      onProductReferenceChange,
      truncateFilesByTotalSize,
      maxTotalSizeMB,
    ]
  );

  const handleDrop = useCallback(
    async (acceptedFiles: File[], fileRejections?: FileRejection[]) => {
      if (fileRejections && fileRejections.length > 0) {
        toast.warning(
          `Some files were rejected. Allowed: ${fileTypes.join(
            ", "
          )}, up to ${maxFileSizeLimit}MB each.`
        );
      }
      if (acceptedFiles.length === 0) return;

      setIsUploading(true);

      try {
        const zoneLabel = isSingleMode ? "reference" : `${activeTab} reference`;
        const toastPromise = toast.promise(
          uploadFilesAndAddToZone(
            acceptedFiles,
            activeTab as "master" | "product",
            false
          ),
          {
            loading: `Uploading ${acceptedFiles.length} file(s) to ${zoneLabel}...`,
            success: (uploadedUrls) =>
              `${uploadedUrls.length} file(s) uploaded to ${zoneLabel}`,
            error: "Failed to upload files. Please try again.",
          }
        );

        await toastPromise.unwrap();
      } catch (error) {
        console.error("File upload failed:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [
      fileTypes,
      maxFileSizeLimit,
      activeTab,
      isSingleMode,
      uploadFilesAndAddToZone,
    ]
  );

  const handleImageClick = useCallback(
    async (assetUrl: string, assetId: string, sizeString?: string) => {
      // Check if image is already selected and toggle it off
      if (masterReference.includes(assetUrl)) {
        const result = removeReferenceFromZone(
          "master",
          assetUrl,
          masterReference,
          productReference
        );
        onMasterReferenceChange(result.newMasterReference);
        toast.success(result.toastMessage);
        return;
      }

      if (productReference.includes(assetUrl)) {
        const result = removeReferenceFromZone(
          "product",
          assetUrl,
          masterReference,
          productReference
        );
        onProductReferenceChange(result.newProductReference);
        toast.success(result.toastMessage);
        return;
      }

      // Check if we can add more images
      if (currentImageCount >= maxLimit) {
        return toast.error(`You can only upload ${maxLimit} image(s).`);
      }

      // Check file size before adding
      const { isValid, sizeInMB } = await checkFileSizeLimit(
        assetUrl,
        sizeString,
        maxFileSizeLimit
      );
      if (!isValid && sizeInMB) {
        toast.error(
          `Image size (${sizeInMB.toFixed(
            1
          )}MB) exceeds the limit of ${maxFileSizeLimit}MB`
        );
        return;
      }

      // Add to the active tab using shared utility
      const result = addReferenceToZone(
        activeTab,
        assetUrl,
        masterReference,
        productReference
      );
      onMasterReferenceChange(result.newMasterReference);
      onProductReferenceChange(result.newProductReference);
      toast.success(result.toastMessage);

      // Update URL-to-ID mapping
      setUrlToIdMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(assetUrl, assetId);
        return newMap;
      });

      // Optimistically update in store
      updateLastAccessed(assetId);

      // Update in backend
      patchItem({
        itemId: assetId,
        data: { last_accessed_at: new Date().toISOString() },
        revalidateAutofillSuggestions: false,
      });
    },
    [
      currentImageCount,
      maxLimit,
      masterReference,
      productReference,
      activeTab,
      onMasterReferenceChange,
      onProductReferenceChange,
      updateLastAccessed,
      patchItem,
      maxFileSizeLimit,
    ]
  );

  const handleDragStart = useCallback(
    (
      e: React.DragEvent,
      assetUrl: string,
      source?: "master" | "product",
      assetId?: string
    ) => {
      e.dataTransfer.setData("assetUrl", assetUrl);
      e.dataTransfer.setData("source", source || "gallery");
      if (assetId) {
        e.dataTransfer.setData("assetId", assetId);
      }
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDropZone = useCallback(
    async (e: React.DragEvent, zone: "master" | "product") => {
      e.preventDefault();
      const assetUrl = e.dataTransfer.getData("assetUrl");
      const source = e.dataTransfer.getData("source");
      const assetId = e.dataTransfer.getData("assetId");

      // Handle file drops from OS directly to zones - upload here
      if (
        (!assetUrl || source === "os") &&
        e.dataTransfer.files &&
        e.dataTransfer.files.length > 0
      ) {
        const files = Array.from(e.dataTransfer.files);
        setIsUploading(true);

        const uploadPromise = async () => {
          const uploadedUrls = await uploadFilesAndAddToZone(
            files,
            zone,
            false
          );
          return {
            count: uploadedUrls.length,
            targetZone: isSingleMode ? "reference" : zone,
          };
        };

        try {
          const zoneLabel = isSingleMode ? "reference" : `${zone} reference`;
          const toastPromise = toast.promise(uploadPromise(), {
            loading: `Uploading ${files.length} file(s) to ${zoneLabel}...`,
            success: (data) =>
              `${data.count} file(s) uploaded to ${data.targetZone}${
                isSingleMode ? "" : " reference"
              }`,
            error: "Failed to upload files. Please try again.",
          });

          await toastPromise.unwrap();
        } catch (error) {
          console.error("Failed to upload files:", error);
        } finally {
          setIsUploading(false);
        }
        return;
      }

      if (!assetUrl) return;

      // Use shared utility function for drop logic (gallery or zone-to-zone moves)
      const result = handleReferenceImageDrop(
        assetUrl,
        source,
        zone,
        masterReference,
        productReference,
        maxLimit
      );

      // If drop should be prevented, show toast and return
      if (result.shouldPrevent) {
        if (result.toastMessage) {
          toast[result.toastMessage.type](result.toastMessage.message);
        }
        return;
      }

      // Handle file size check only for gallery drops (new additions)
      if (source === "gallery") {
        const galleryItem = galleryItems.find(
          (item) => item.asset_url === assetUrl
        );
        const { isValid, sizeInMB } = await checkFileSizeLimit(
          assetUrl,
          galleryItem?.size,
          maxFileSizeLimit
        );
        if (!isValid && sizeInMB) {
          toast.error(
            `Image size (${sizeInMB.toFixed(
              1
            )}MB) exceeds the limit of ${maxFileSizeLimit}MB`
          );
          return;
        }

        // Optimistically update in store for gallery items
        if (assetId) {
          updateLastAccessed(assetId);
          patchItem({
            itemId: assetId,
            data: { last_accessed_at: new Date().toISOString() },
          });
        }
      }

      // Apply the state updates
      if (result.newMasterReference !== undefined) {
        onMasterReferenceChange(result.newMasterReference);
      }
      if (result.newProductReference !== undefined) {
        onProductReferenceChange(result.newProductReference);
      }

      // Show success toast
      if (result.toastMessage) {
        toast[result.toastMessage.type](result.toastMessage.message);
      }
    },
    [
      masterReference,
      productReference,
      maxLimit,
      onMasterReferenceChange,
      onProductReferenceChange,
      updateLastAccessed,
      patchItem,
      galleryItems,
      maxFileSizeLimit,
      uploadFilesAndAddToZone,
    ]
  );

  const handleRemoveImage = useCallback(
    (zone: "master" | "product", url: string) => {
      const result = removeReferenceFromZone(
        zone,
        url,
        masterReference,
        productReference
      );
      onMasterReferenceChange(result.newMasterReference);
      onProductReferenceChange(result.newProductReference);
    },
    [
      masterReference,
      productReference,
      onMasterReferenceChange,
      onProductReferenceChange,
    ]
  );

  // Extract image files from clipboard
  const extractImageFiles = useCallback(
    (items: DataTransferItemList): File[] => {
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      return files;
    },
    []
  );

  // Handle paste for specific zone
  const handleZonePaste = useCallback(
    (zone: "master" | "product") => async (e: React.ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = extractImageFiles(e.clipboardData.items);
      if (files.length === 0) return;

      setIsUploading(true);
      try {
        const zoneLabel = isSingleMode ? "reference" : `${zone} reference`;
        await toast.promise(uploadFilesAndAddToZone(files, zone, false), {
          loading: `Uploading ${files.length} image(s) from clipboard to ${zoneLabel}...`,
          success: (uploadedUrls) =>
            `${uploadedUrls.length} image(s) pasted to ${zoneLabel}`,
          error: "Failed to upload images from clipboard.",
        });
      } catch (error) {
        console.error("Clipboard paste failed:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [isSingleMode, uploadFilesAndAddToZone, extractImageFiles]
  );

  const handleDeleteGalleryItem = useCallback(
    (item: GalleryItemResponse) => {
      // Remove from reference zones if attached
      let newMasterReference = masterReference;
      let newProductReference = productReference;

      if (masterReference.includes(item.asset_url)) {
        newMasterReference = masterReference.filter(
          (url) => url !== item.asset_url
        );
        onMasterReferenceChange(newMasterReference);
      }

      if (productReference.includes(item.asset_url)) {
        newProductReference = productReference.filter(
          (url) => url !== item.asset_url
        );
        onProductReferenceChange(newProductReference);
      }

      if (item.asset_source === "reference") {
        // Delete from gallery if asset_source is "reference"
        deleteItem(item.id);
        const newItems = galleryItems.filter((i) => i.id !== item.id);
        setItems(newItems);
      } else {
        // Just remove from history by patching last_accessed_at to null
        patchItem({
          itemId: item.id,
          data: { last_accessed_at: null as any },
          revalidateAutofillSuggestions: false,
        });
        const newItems = galleryItems.filter((i) => i.id !== item.id);
        setItems(newItems);
      }
    },
    [
      galleryItems,
      deleteItem,
      patchItem,
      setItems,
      masterReference,
      productReference,
      onMasterReferenceChange,
      onProductReferenceChange,
    ]
  );

  const handleMediaLibrarySelection = useCallback(
    async (items: GalleryItem[]) => {
      const selectionPromise = async () => {
        // Check file sizes for all selected items
        const validItems: GalleryItem[] = [];
        const invalidItems: string[] = [];

        for (const item of items) {
          const { isValid, sizeInMB } = await checkFileSizeLimit(
            item.asset_url,
            item.size,
            maxFileSizeLimit
          );
          if (isValid) {
            validItems.push(item);
          } else {
            invalidItems.push(
              `${item.asset_title || "Unnamed file"} (${sizeInMB?.toFixed(
                1
              )}MB)`
            );
          }
        }

        // If no valid items, don't proceed
        if (validItems.length === 0) {
          throw new Error("No valid images to add (all exceeded size limit)");
        }

        // Show warning if some items were rejected
        if (invalidItems.length > 0) {
          toast.warning(
            `${invalidItems.length} image(s) rejected due to size limit.`
          );
        }

        const selectedUrls = validItems.map((item) => item.asset_url);

        // Add to references
        if (activeTab === "master") {
          const newMasterRefs = [...masterReference, ...selectedUrls];
          onMasterReferenceChange(newMasterRefs);
        } else {
          const newProductRefs = [...productReference, ...selectedUrls];
          onProductReferenceChange(newProductRefs);
        }

        // Optimistically add items to gallery - keep original is_master value (versioning control)
        const itemsAsResponse = validItems.map((item) => ({
          ...item,
        })) as GalleryItemResponse[];
        const itemsWithIds = itemsAsResponse.filter((item) => item.id);

        if (itemsWithIds.length > 0) {
          addItems(itemsWithIds);
        }

        // Update URL-to-ID mapping for selected items from media library
        setUrlToIdMap((prev) => {
          const newMap = new Map(prev);
          validItems.forEach((item) => {
            const itemResponse = item as GalleryItemResponse;
            if (itemResponse.id && itemResponse.asset_url) {
              newMap.set(itemResponse.asset_url, itemResponse.id);
            }
          });
          return newMap;
        });

        // Update last_accessed_at for each item
        validItems.forEach((item) => {
          const itemResponse = item as GalleryItemResponse;
          if (itemResponse.id) {
            updateLastAccessed(itemResponse.id);
            patchItem({
              itemId: itemResponse.id,
              data: {
                last_accessed_at: new Date().toISOString(),
              },
              revalidateAutofillSuggestions: false,
            });
          }
        });

        setMediaLibraryOpen(false);

        return {
          count: validItems.length,
          targetZone: isSingleMode ? "reference" : activeTab,
        };
      };

      try {
        const zoneLabel = isSingleMode ? "reference" : `${activeTab} reference`;
        const toastPromise = toast.promise(selectionPromise(), {
          loading: `Adding ${items.length} image(s) to ${zoneLabel}...`,
          success: (data) =>
            `${data.count} image(s) added to ${data.targetZone}${
              isSingleMode ? "" : " reference"
            }`,
          error: (err) => err.message || "Failed to add images",
        });

        await toastPromise.unwrap();
      } catch (error) {
        console.error("Media library selection failed:", error);
      }
    },
    [
      activeTab,
      masterReference,
      productReference,
      onMasterReferenceChange,
      onProductReferenceChange,
      addItems,
      updateLastAccessed,
      patchItem,
      maxFileSizeLimit,
    ]
  );

  // Early return for inline variant when closed
  if (isInlineMode && !isOpen) {
    return null;
  }

  // Render inline variant
  if (isInlineMode) {
    return (
      <>
        <div
          id="reference-zone"
          className="w-full border rounded-xl bg-background p-6"
        >
          <div className="flex gap-6 h-[450px]">
            {/* LEFT COLUMN - Upload/Drop Area */}
            <div className="w-[280px] shrink-0">
              <ReferenceUploadArea
                fileTypes={fileTypes}
                maxFileSizeLimit={maxFileSizeLimit}
                remainingSlots={remainingSlots}
                isUploading={isUploading}
                onDrop={handleDrop}
                onOpenMediaLibrary={() => setMediaLibraryOpen(true)}
              />
            </div>

            {/* RIGHT COLUMN - Gallery */}
            <div className="flex-1 min-w-0 flex flex-col ml-5">
              <div
                className="flex-1 overflow-y-auto"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropZone(e, activeTab)}
              >
                <ReferenceGalleryGrid
                  items={galleryItems}
                  isLoading={isLoadingStore}
                  masterReferenceUrls={masterReference}
                  productReferenceUrls={productReference}
                  onItemClick={handleImageClick}
                  onDragStart={(e, assetUrl, assetId) =>
                    handleDragStart(e, assetUrl, undefined, assetId)
                  }
                  onDeleteItem={handleDeleteGalleryItem}
                  isSingleMode={false}
                />
              </div>
            </div>
          </div>
        </div>

        <MediaLibraryDialog
          open={mediaLibraryOpen}
          onOpenChange={setMediaLibraryOpen}
          onMultipleMediaItemsSelected={handleMediaLibrarySelection}
          filters={{
            brands: [selectedBrandId!],
            campaigns: [],
            product_categories: [],
            has_product: undefined,
            has_people: undefined,
            has_lifestyle_context: undefined,
            asset_types: ["image"],
            asset_sources: [],
            media_format: [],
            aspect_ratio: [],
            workflow_status: [],
            is_favourite: undefined,
            is_archived: undefined,
            moodboards: [],
          }}
          brandId={selectedBrandId!}
          campaignId={currentCampaignId || undefined}
          isMultiSelect={true}
          inSelectionGalleryIds={selectedGalleryIds}
          maxSelectionCount={remainingSlots}
        />
      </>
    );
  }

  // Render popover variant (default)
  return (
    <>
      <Popover open={isOpen} onOpenChange={handleOpenChange} modal>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild hidden={!showPopoverTrigger}>
              {customTrigger || (
                <Button
                  variant="outline"
                  size="icon"
                  disabled={disabled}
                  className="relative"
                >
                  <Images />
                  {currentImageCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-white text-xs flex items-center justify-center font-semibold">
                      {currentImageCount}
                    </span>
                  )}
                </Button>
              )}
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Attach Reference Image(s)</TooltipContent>
        </Tooltip>

        <PopoverContent
          id="reference-zone"
          align={popoverAlign}
          side={popoverSide}
          className={`${
            isSingleMode
              ? "w-[calc(100vw-2rem)] max-w-[650px] mr-3"
              : "w-[1000px]"
          }  p-0 rounded-xl max-h-[500px] shadow-xl border bg-background overflow-y-scroll`}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          {isSingleMode ? (
            // Single mode - vertical layout with 3 sections
            <div className="flex flex-col h-full overflow-y-auto">
              <div className="p-4 space-y-3">
                {/* 1. DROP ZONE */}
                <div className="w-full">
                  <ReferenceUploadArea
                    fileTypes={fileTypes}
                    maxFileSizeLimit={maxFileSizeLimit}
                    remainingSlots={remainingSlots}
                    isUploading={isUploading}
                    onDrop={handleDrop}
                    onOpenMediaLibrary={() => setMediaLibraryOpen(true)}
                    compact={true}
                  />
                </div>

                {/* 3. GALLERY SECTION */}
                <div className="border rounded-lg p-3">
                  <div className="overflow-y-auto max-h-[180px] overflow-x-hidden">
                    <ReferenceGalleryGrid
                      items={galleryItems}
                      isLoading={isLoadingStore}
                      masterReferenceUrls={masterReference}
                      productReferenceUrls={productReference}
                      onItemClick={handleImageClick}
                      onDragStart={(e, assetUrl, assetId) =>
                        handleDragStart(e, assetUrl, undefined, assetId)
                      }
                      onDeleteItem={handleDeleteGalleryItem}
                      isSingleMode={true}
                    />
                  </div>
                </div>

                {/* 2. REFERENCE IMAGE ZONE */}
                <div className="w-full">
                  <ReferenceZone
                    type="master"
                    icon={Paperclip}
                    title="Reference Image"
                    description="Add reference images. (Click, drag, or paste to add)"
                    images={masterReference}
                    isSelected={false}
                    onClick={() => {}}
                    onDrop={(e) => handleDropZone(e, "master")}
                    onDragStart={(e, url) => handleDragStart(e, url, "master")}
                    onRemoveImage={(url) => handleRemoveImage("master", url)}
                    showAddButton={false}
                    onPaste={handleZonePaste("master")}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full">
              {/* LEFT COLUMN - Upload/Drop Area */}
              <ReferenceUploadArea
                fileTypes={fileTypes}
                maxFileSizeLimit={maxFileSizeLimit}
                remainingSlots={remainingSlots}
                isUploading={isUploading}
                onDrop={handleDrop}
                onOpenMediaLibrary={() => setMediaLibraryOpen(true)}
              />

              {/* RIGHT COLUMN - Tabs + Gallery */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-5 space-y-5">
                  {/* Dual mode - show master and product zones with tabs */}
                  <div className="flex gap-4">
                    {/* MASTER REFERENCE SECTION */}
                    <ReferenceZone
                      type="master"
                      icon={Paperclip}
                      title="Master Reference"
                      description="Use elements of an image. (Click, drag, or paste to add)"
                      images={masterReference}
                      isSelected={activeTab === "master"}
                      onClick={openForMaster}
                      onDrop={(e) => handleDropZone(e, "master")}
                      onDragStart={(e, url) =>
                        handleDragStart(e, url, "master")
                      }
                      onRemoveImage={(url) => handleRemoveImage("master", url)}
                      showAddButton={productReference.length > 0}
                      onAddClick={openForMaster}
                      onPaste={handleZonePaste("master")}
                    />

                    {/* PRODUCT REFERENCE SECTION */}
                    <ReferenceZone
                      type="product"
                      icon={PanelTop}
                      title="Product Reference"
                      description="Use a product image. This might alter your prompt. (Click, drag, or paste to add)"
                      images={productReference}
                      isSelected={activeTab === "product"}
                      onClick={openForProduct}
                      onDrop={(e) => handleDropZone(e, "product")}
                      onDragStart={(e, url) =>
                        handleDragStart(e, url, "product")
                      }
                      onRemoveImage={(url) => handleRemoveImage("product", url)}
                      showAddButton={masterReference.length > 0}
                      onAddClick={openForProduct}
                      isMagicEnabled={isMagicEnabled}
                      onToggleMagic={onToggleMagic}
                      onPaste={handleZonePaste("product")}
                    />
                  </div>

                  {/* GALLERY SECTION */}
                  <div
                    id="gallery-section"
                    className="overflow-y-auto max-h-[300px] overflow-x-hidden"
                  >
                    <ReferenceGalleryGrid
                      items={galleryItems}
                      isLoading={isLoadingStore}
                      masterReferenceUrls={masterReference}
                      productReferenceUrls={productReference}
                      onItemClick={handleImageClick}
                      onDragStart={(e, assetUrl, assetId) =>
                        handleDragStart(e, assetUrl, undefined, assetId)
                      }
                      onDeleteItem={handleDeleteGalleryItem}
                      isSingleMode={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <MediaLibraryDialog
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        onMultipleMediaItemsSelected={handleMediaLibrarySelection}
        filters={{
          brands: [selectedBrandId!],
          campaigns: [],
          product_categories: [],
          has_product: undefined,
          has_people: undefined,
          has_lifestyle_context: undefined,
          asset_types: ["image"],
          asset_sources: [],
          media_format: [],
          aspect_ratio: [],
          workflow_status: [],
          is_favourite: undefined,
          is_archived: undefined,
          moodboards: [],
        }}
        brandId={selectedBrandId!}
        campaignId={currentCampaignId || undefined}
        isMultiSelect={true}
        inSelectionGalleryIds={selectedGalleryIds}
        maxSelectionCount={maxLimit}
      />
    </>
  );
};

export default ReferenceImageSelector;
