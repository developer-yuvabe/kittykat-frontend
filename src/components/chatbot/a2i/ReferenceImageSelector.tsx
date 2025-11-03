import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Images,
  Upload,
  X,
  Paperclip,
  PanelTop,
  RefreshCw,
  Trash,
} from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useBrandStore } from "@/store/brand.store";
import { useGalleryQuery } from "@/hooks/useGallery";
import { cn, getExtensionFromUrl } from "@/lib/utils";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { GalleryItem } from "@/types/gallery.types";
import { useReferenceImagesStore } from "@/store/reference-image.store";
import ZoomableImage from "@/components/ui/zoomable-image";

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
          asset_sources: [],
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
    setItems,
  } = useReferenceImagesStore();

  // Fetch reference images when component mounts or brand changes
  useEffect(() => {
    if (selectedBrandId) {
      setItems(getGalleryItems());
    }
  }, [selectedBrandId, isFetching]);

  // Auto-refetch when popover opens
  useEffect(() => {
    if (isOpen && selectedBrandId) {
      setItems(getGalleryItems());
    }
  }, [isOpen, selectedBrandId]);

  const currentImageCount = masterReference.length + productReference.length;
  const remainingSlots = maxLimit - currentImageCount;

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
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
          await bulkUpload({
            gallery_items: uploadedGalleryItems,
            brand_id: selectedBrandId!,
          });
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
      currentCampaignId,
      bulkUpload,
      selectedTab,
      masterReference,
      productReference,
      onMasterReferenceChange,
      onProductReferenceChange,
    ]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: Object.fromEntries(fileTypes.map((type) => [type, []])),
    disabled: isUploading || remainingSlots <= 0,
    maxFiles: remainingSlots,
    maxSize: maxFileSizeLimit * 1024 * 1024,
  });

  const handleImageClick = (assetUrl: string, assetId: string) => {
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
  };

  const handleDragStart = (
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
  };

  const handleDropZone = (e: React.DragEvent, zone: "master" | "product") => {
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
  };

  const clearReference = (zone: "master" | "product", url: string) => {
    // Find the item in gallery to patch and remove from store
    const itemToRemove = galleryItems.find((item) => item.asset_url === url);
    if (itemToRemove) {
      // Patch last_accessed_at to null
      patchItem({
        itemId: itemToRemove.id,
        data: { last_accessed_at: null as any },
        revalidateAutofillSuggestions: false,
      });
      // Remove from store
      const newItems = galleryItems.filter((item) => item.asset_url !== url);
      setItems(newItems);
    }

    // Remove from reference arrays
    if (zone === "master") {
      onMasterReferenceChange(masterReference.filter((u) => u !== url));
    } else {
      onProductReferenceChange(productReference.filter((u) => u !== url));
    }
  };

  const handleReferenceClick = () => {
    const gallerySection = document.getElementById("gallery-section");
    if (gallerySection) {
      gallerySection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
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
          <div className="w-[320px] border-r bg-muted/5 p-5 flex flex-col justify-center">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all bg-background hover:bg-muted/20 flex flex-col items-center justify-center min-h-[400px]",
                isDragActive && "border-primary bg-primary/10",
                (isUploading || remainingSlots <= 0) && "opacity-50"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="font-semibold text-base">Drop files here</p>
                  <p className="text-xs text-muted-foreground">
                    Supported format: PNG , JPG & WEBP
                  </p>
                  <p className="text-sm text-primary mt-3 underline cursor-pointer font-medium">
                    Browse files on device
                  </p>
                </div>

                <div className="flex items-center w-full my-2">
                  <div className="flex-grow" />
                  <span className="px-3 text-xs text-muted-foreground uppercase font-medium">
                    or
                  </span>
                  <div className="flex-grow " />
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReferenceClick();
                  }}
                  className="text-sm text-primary underline cursor-pointer font-medium hover:text-primary/80"
                >
                  Select from Gallery
                </button>

                <p className="text-xs text-muted-foreground mt-4">
                  {remainingSlots > 0
                    ? `You can add ${remainingSlots} more image${
                        remainingSlots > 1 ? "s" : ""
                      }`
                    : "Maximum upload limit reached"}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Tabs + Gallery */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-5">
              <div className="flex gap-4">
                {/* MASTER REFERENCE SECTION */}
                <div
                  className={cn(
                    "flex-1 border rounded-xl p-4 bg-background cursor-pointer transition-all",
                    selectedTab === "master"
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setSelectedTab("master")}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropZone(e, "master")}
                >
                  <div className="flex flex-row items-center gap-2 mb-2">
                    <Paperclip className="h-5 w-5 " />
                    <div className="text-start">
                      <p className="font-medium text-sm">Master Reference</p>
                      <p className="text-xs text-muted-foreground">
                        Use elements of an image. (Click or drag to add)
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {masterReference.map((url) => (
                      <div
                        key={url}
                        className="relative w-20 h-20 rounded-lg"
                        draggable
                        onDragStart={(e) => handleDragStart(e, url, "master")}
                      >
                        <ZoomableImage
                          src={url}
                          alt="Master reference"
                          className="w-full h-full object-cover rounded-lg"
                          variant="default"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearReference("master", url);
                          }}
                          className="p-1 absolute -top-2 -right-2 bg-primary rounded-full text-white hover:bg-destructive z-10"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PRODUCT REFERENCE SECTION */}
                <div
                  className={cn(
                    "flex-1 border rounded-xl p-4 bg-background cursor-pointer transition-all",
                    selectedTab === "product"
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setSelectedTab("product")}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropZone(e, "product")}
                >
                  <div className="flex flex-row items-center gap-2 mb-2">
                    <PanelTop className="h-8 w-8 " />
                    <div className="text-start">
                      <p className="font-medium text-sm">Product Reference</p>
                      <p className="text-xs text-muted-foreground">
                        Use a product image. This might alter your prompt.
                        (Click or drag to add)
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {productReference.map((url) => (
                      <div
                        key={url}
                        className="relative w-20 h-20 rounded-lg"
                        draggable
                        onDragStart={(e) => handleDragStart(e, url, "product")}
                      >
                        <ZoomableImage
                          src={url}
                          alt="Product reference"
                          className="w-full h-full object-cover rounded-lg"
                          variant="default"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearReference("product", url);
                          }}
                          className="p-1 absolute -top-2 -right-2 bg-primary rounded-full text-white hover:bg-destructive z-10"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* GALLERY SECTION */}

              <div
                id="gallery-section"
                className="overflow-y-auto max-h-[300px] overflow-x-hidden"
              >
                {isLoadingStore && galleryItems.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
                    {galleryItems.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, item.asset_url, undefined, item.id)
                        }
                        onClick={() =>
                          handleImageClick(item.asset_url, item.id)
                        }
                        className={cn(
                          "relative aspect-square rounded-lg group cursor-pointer border-2 transition-all",
                          masterReference.includes(item.asset_url) ||
                            productReference.includes(item.asset_url)
                            ? "border-primary ring-2 ring-primary"
                            : "border-transparent hover:border-primary"
                        )}
                      >
                        <img
                          src={item.asset_url}
                          alt={item.asset_title || "Gallery item"}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        {(masterReference.includes(item.asset_url) ||
                          productReference.includes(item.asset_url)) && (
                          <div className="absolute top-1 right-1 bg-primary text-white text-xs px-2 py-0.5 rounded">
                            {masterReference.includes(item.asset_url)
                              ? "Master"
                              : "Product"}
                          </div>
                        )}
                        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.asset_source === "reference") {
                                // Delete from gallery if asset_source is "reference"
                                deleteItem(item.id);
                                const newItems = galleryItems.filter(
                                  (i) => i.id !== item.id
                                );
                                setItems(newItems);
                              } else {
                                // Just remove from history by patching last_accessed_at to null
                                patchItem({
                                  itemId: item.id,
                                  data: { last_accessed_at: null as any },
                                  revalidateAutofillSuggestions: false,
                                });
                                const newItems = galleryItems.filter(
                                  (i) => i.id !== item.id
                                );
                                setItems(newItems);
                              }
                            }}
                            className="p-1 bg-destructive text-white rounded-full hover:bg-destructive/80"
                          >
                            <Trash className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ReferenceImageSelector;
