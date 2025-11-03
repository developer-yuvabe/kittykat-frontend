import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Images, Paperclip, PanelTop } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
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
import { allMediaAssetSources } from "@/lib/gallery.utils";

interface ReferenceImageSelectorProps {
  masterReference: string[];
  productReference: string[];
  onMasterReferenceChange: (urls: string[]) => void;
  onProductReferenceChange: (urls: string[]) => void;
  maxLimit: number;
  fileTypes: string[];
  maxFileSizeLimit: number;
  disabled?: boolean;
  currentCampaignId?: string | null;
}

const ReferenceImageSelector = ({
  masterReference,
  productReference,
  onMasterReferenceChange,
  onProductReferenceChange,
  maxLimit,
  fileTypes,
  maxFileSizeLimit,
  disabled = false,
  currentCampaignId,
}: ReferenceImageSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"master" | "product">(
    "master"
  );
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  const { selectedBrandId } = useBrandStore();

  const { bulkUpload, patchItem, getGalleryItems, isFetching, deleteItem } =
    useGalleryQuery(
      {
        selectedFilters: {
          brands: [selectedBrandId!],
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

  // Fetch reference images when component mounts or brand changes
  useEffect(() => {
    if (selectedBrandId && !isFetching) {
      setItems(getGalleryItems());
    }
    setIsLoading(isFetching);
  }, [selectedBrandId, isFetching]);

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
        const uploadedGalleryItems: GalleryItem[] = [];
        const uploadedUrls: string[] = [];
        const uploadPromises = acceptedFiles.map(async (file) => {
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
          } catch {
            console.error("Upload failed for", file.name);
            return null;
          }
        });

        await Promise.all(uploadPromises);

        if (uploadedGalleryItems.length > 0) {
          // Upload to backend
          const response = await bulkUpload({
            gallery_items: uploadedGalleryItems,
            brand_id: selectedBrandId!,
          });

          // Add uploaded items to gallery after successful upload
          if (response && response.length > 0) {
            addItems(response);
          }
        }

        // Automatically add uploaded images to the selected tab
        if (uploadedUrls.length > 0) {
          if (selectedTab === "master") {
            onMasterReferenceChange([...masterReference, ...uploadedUrls]);
            toast.success("Master references added");
          } else {
            onProductReferenceChange([...productReference, ...uploadedUrls]);
            toast.success("Product references added");
          }
        }

        toast.success("Files uploaded successfully!");
      } catch {
        toast.error("Failed to upload files. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [
      fileTypes,
      maxFileSizeLimit,
      selectedBrandId,
      bulkUpload,
      selectedTab,
      masterReference,
      productReference,
      onMasterReferenceChange,
      onProductReferenceChange,
      addItems,
    ]
  );

  const handleImageClick = useCallback(
    (assetUrl: string, assetId: string) => {
      if (currentImageCount >= maxLimit) {
        return toast.error(`You can only upload ${maxLimit} image(s).`);
      }

      if (
        masterReference.includes(assetUrl) ||
        productReference.includes(assetUrl)
      ) {
        return toast.error("This image is already selected as a reference.");
      }

      if (selectedTab === "master") {
        onMasterReferenceChange([...masterReference, assetUrl]);
        toast.success("Master reference added");
      } else {
        onProductReferenceChange([...productReference, assetUrl]);
        toast.success("Product reference added");
      }

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
      selectedTab,
      onMasterReferenceChange,
      onProductReferenceChange,
      updateLastAccessed,
      patchItem,
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
    (e: React.DragEvent, zone: "master" | "product") => {
      e.preventDefault();
      const assetUrl = e.dataTransfer.getData("assetUrl");
      const source = e.dataTransfer.getData("source");
      const assetId = e.dataTransfer.getData("assetId");

      if (!assetUrl) return;

      if (currentImageCount >= maxLimit) {
        return toast.error(`You can only upload ${maxLimit} image(s).`);
      }

      if (source === "master" && zone === "product") {
        const newMaster = masterReference.filter((url) => url !== assetUrl);
        onMasterReferenceChange(newMaster);
        onProductReferenceChange([...productReference, assetUrl]);
        toast.success("Reference moved to Product");
      } else if (source === "product" && zone === "master") {
        const newProduct = productReference.filter((url) => url !== assetUrl);
        onProductReferenceChange(newProduct);
        onMasterReferenceChange([...masterReference, assetUrl]);
        toast.success("Reference moved to Master");
      } else {
        if (
          masterReference.includes(assetUrl) ||
          productReference.includes(assetUrl)
        ) {
          return toast.error("This image is already selected as a reference.");
        }

        // Optimistically update in store
        if (assetId) {
          updateLastAccessed(assetId);

          // Update in backend
          patchItem({
            itemId: assetId,
            data: { last_accessed_at: new Date().toISOString() },
          });
        }

        if (zone === "master") {
          onMasterReferenceChange([...masterReference, assetUrl]);
          toast.success("Master reference added");
        } else {
          onProductReferenceChange([...productReference, assetUrl]);
          toast.success("Product reference added");
        }
      }
    },
    [
      currentImageCount,
      maxLimit,
      masterReference,
      productReference,
      onMasterReferenceChange,
      onProductReferenceChange,
      updateLastAccessed,
      patchItem,
    ]
  );

  const handleRemoveImage = useCallback(
    (zone: "master" | "product", url: string) => {
      if (zone === "master") {
        onMasterReferenceChange(masterReference.filter((u) => u !== url));
      } else {
        onProductReferenceChange(productReference.filter((u) => u !== url));
      }
    },
    [
      masterReference,
      productReference,
      onMasterReferenceChange,
      onProductReferenceChange,
    ]
  );

  const handleDeleteGalleryItem = useCallback(
    (item: GalleryItemResponse) => {
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
    [galleryItems, deleteItem, patchItem, setItems]
  );

  const handleMediaLibrarySelection = useCallback(
    (items: GalleryItem[]) => {
      const selectedUrls = items.map((item) => item.asset_url);

      if (selectedTab === "master") {
        const newMasterRefs = [...masterReference, ...selectedUrls];
        onMasterReferenceChange(newMasterRefs);
        toast.success(`${items.length} master reference(s) added`);
      } else {
        const newProductRefs = [...productReference, ...selectedUrls];
        onProductReferenceChange(newProductRefs);
        toast.success(`${items.length} product reference(s) added`);
      }

      // Optimistically add items to gallery
      const itemsAsResponse = items.map((item) => item as GalleryItemResponse);
      const itemsWithIds = itemsAsResponse.filter((item) => item.id);

      if (itemsWithIds.length > 0) {
        addItems(itemsWithIds);
      }

      // Update last_accessed_at for each item
      items.forEach((item) => {
        const itemResponse = item as GalleryItemResponse;
        if (itemResponse.id) {
          updateLastAccessed(itemResponse.id);
          patchItem({
            itemId: itemResponse.id,
            data: { last_accessed_at: new Date().toISOString() },
            revalidateAutofillSuggestions: false,
          });
        }
      });

      setMediaLibraryOpen(false);
    },
    [
      selectedTab,
      masterReference,
      productReference,
      onMasterReferenceChange,
      onProductReferenceChange,
      addItems,
      updateLastAccessed,
      patchItem,
    ]
  );

  return (
    <>
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          // Don't close popover if media library is open
          if (!open && mediaLibraryOpen) {
            return;
          }
          setIsOpen(open);
        }}
      >
        <PopoverTrigger asChild>
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
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="top"
          className="w-[1000px] max-h-[500px] p-0 rounded-xl shadow-xl border bg-background overflow-hidden"
        >
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
                <div className="flex gap-4">
                  {/* MASTER REFERENCE SECTION */}
                  <ReferenceZone
                    type="master"
                    icon={Paperclip}
                    title="Master Reference"
                    description="Use elements of an image. (Click or drag to add)"
                    images={masterReference}
                    isSelected={selectedTab === "master"}
                    onClick={() => setSelectedTab("master")}
                    onDrop={(e) => handleDropZone(e, "master")}
                    onDragStart={(e, url) => handleDragStart(e, url, "master")}
                    onRemoveImage={(url) => handleRemoveImage("master", url)}
                  />

                  {/* PRODUCT REFERENCE SECTION */}
                  <ReferenceZone
                    type="product"
                    icon={PanelTop}
                    title="Product Reference"
                    description="Use a product image. This might alter your prompt. (Click or drag to add)"
                    images={productReference}
                    isSelected={selectedTab === "product"}
                    onClick={() => setSelectedTab("product")}
                    onDrop={(e) => handleDropZone(e, "product")}
                    onDragStart={(e, url) => handleDragStart(e, url, "product")}
                    onRemoveImage={(url) => handleRemoveImage("product", url)}
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
                    selectedUrls={[...masterReference, ...productReference]}
                    onItemClick={handleImageClick}
                    onDragStart={(e, assetUrl, assetId) =>
                      handleDragStart(e, assetUrl, undefined, assetId)
                    }
                    onDeleteItem={handleDeleteGalleryItem}
                  />
                </div>
              </div>
            </div>
          </div>
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
        inSelectionGalleryIds={[...masterReference, ...productReference]}
        maxSelectionCount={remainingSlots}
      />
    </>
  );
};

export default ReferenceImageSelector;
