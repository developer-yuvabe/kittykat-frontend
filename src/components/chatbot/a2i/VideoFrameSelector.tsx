import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SkipBack, SkipForward } from "lucide-react";
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
import { allMediaAssetSources, checkFileSizeLimit } from "@/lib/gallery.utils";
import { VideoFrameZone } from "./VideoFrameZone";
import { VideoFrameGalleryGrid } from "./VideoFrameGalleryGrid";

interface VideoFrameSelectorProps {
  // Dual-zone props
  startFrame: string | null;
  endFrame: string | null;
  onStartFrameChange?: (url: string | null) => void;
  onEndFrameChange?: (url: string | null) => void;
  activeTab?: "start_frame" | "end_frame";
  onTabChange?: (tab: "start_frame" | "end_frame") => void;

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
  showPopoverTrigger: boolean;
  setShowPopoverTrigger: (show: boolean) => void;
  isEndFrameAvailable?: boolean;
}

const VideoFrameSelector = ({
  // Dual-zone props
  startFrame: startFrameProp,
  endFrame: endFrameProp,
  onStartFrameChange: onStartFrameChangeProp,
  onEndFrameChange: onEndFrameChangeProp,
  activeTab: activeTabProp,
  onTabChange: onTabChangeProp,

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
  isEndFrameAvailable = true,
  setShowPopoverTrigger,
}: VideoFrameSelectorProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const startFrame: string | null = startFrameProp || null;
  const endFrame: string | null = endFrameProp || null;
  const activeTab = activeTabProp;

  const onStartFrameChange = onStartFrameChangeProp;
  const onEndFrameChange = onEndFrameChangeProp;

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

  const currentImageCount = (startFrame ? 1 : 0) + (endFrame ? 1 : 0);
  const remainingSlots = maxLimit - currentImageCount;

  const openForStart = useCallback(() => {
    // setShowPopoverTrigger(false);
    onTabChange("start_frame");
    handleOpenChange(true);
  }, [onTabChange, handleOpenChange]);

  const openForEnd = useCallback(() => {
    onTabChange("end_frame");
    handleOpenChange(true);
  }, [onTabChange, handleOpenChange]);

  // Effect 1: Fetch on brand/query change (only primitives)
  useEffect(() => {
    if (selectedBrandId && !isFetching) {
      setItems(getGalleryItems()); // getGalleryItems() is fine here (no dep needed)
    }
  }, [selectedBrandId, isFetching]); // Only changes that matter

  // Effect 2: Sync loading (minimal deps)
  useEffect(() => {
    setIsLoading(isFetching);
  }, [isFetching]); // isFetching is primitive

  // Helper function to get file size in MB
  const getFileSizeInMB = useCallback(async (file: File): Promise<number> => {
    return file.size / (1024 * 1024);
  }, []);

  // Helper to set frame, clearing from other if necessary
  const setFrame = useCallback(
    (zone: "start" | "end", url: string | null) => {
      if (url === null) {
        if (zone === "start") {
          onStartFrameChange?.(null);
        } else {
          onEndFrameChange?.(null);
        }
        return;
      }

      // Clear from other zone if the same URL is there
      const otherZone = zone === "start" ? "end" : "start";
      const otherCurrent = otherZone === "start" ? startFrame : endFrame;
      if (otherCurrent === url) {
        if (otherZone === "start") {
          onStartFrameChange?.(null);
        } else {
          onEndFrameChange?.(null);
        }
      }

      // Set to this zone
      if (zone === "start") {
        onStartFrameChange?.(url);
      } else {
        onEndFrameChange?.(url);
      }
    },
    [startFrame, endFrame, onStartFrameChange, onEndFrameChange]
  );

  // Upload single file and add to gallery
  const uploadFileAndAddToGallery = useCallback(
    async (file: File): Promise<string> => {
      if (maxTotalSizeMB) {
        const fileSizeMB = await getFileSizeInMB(file);
        if (fileSizeMB > maxTotalSizeMB) {
          throw new Error(
            `File exceeds total size limit of ${maxTotalSizeMB}MB`
          );
        }
      }

      const uploadedUrl = await uploadFileAndReturnUrl(
        file.name,
        file.type,
        "brands",
        file,
        selectedBrandId
      );

      const galleryItem: GalleryItem = {
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
      };

      const response = await bulkUpload({
        gallery_items: [galleryItem],
        brand_id: selectedBrandId!,
      });

      if (response && response.length > 0) {
        addItems(response);
      }

      return uploadedUrl;
    },
    [selectedBrandId, bulkUpload, addItems, maxTotalSizeMB, getFileSizeInMB]
  );

  const handleDrop = useCallback(
    async (acceptedFiles: File[], fileRejections?: FileRejection[]) => {
      if (fileRejections && fileRejections.length > 0) {
        const rejectedFile = fileRejections[0]?.file;
        if (rejectedFile && rejectedFile.type?.startsWith("video/")) {
          toast.info("Can't upload Video Asset. Coming Soon ...");
          return;
        }
        toast.warning(
          `Some files were rejected. Allowed: ${fileTypes.join(
            ", "
          )}, up to ${maxFileSizeLimit}MB each.`
        );
      }
      if (acceptedFiles.length === 0) return;

      // Only allow one file like your original logic
      if (acceptedFiles.length > 1) {
        toast.warning("Only one frame allowed per zone. Using the first file.");
      }

      const file = acceptedFiles[0];
      setIsUploading(true);

      try {
        const zoneLabel = `${activeTab} frame`;

        const toastPromise = toast.promise(uploadFileAndAddToGallery(file), {
          loading: `Uploading to ${zoneLabel}...`,
          success: `File uploaded successfully to ${zoneLabel}`,
          error: "Failed to upload file. Please try again.",
        });

        const uploadedUrl = await toastPromise.unwrap();

        setFrame(activeTab === "start_frame" ? "start" : "end", uploadedUrl);
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
      uploadFileAndAddToGallery,
      setFrame,
    ]
  );

  const handleImageClick = useCallback(
    async (assetUrl: string, assetId: string, sizeString?: string) => {
      // const zone = activeTab as "start" | "end";
      const zone = activeTab === "start_frame" ? "start" : "end";
      // console.log("Clicked image for zone:", zone, assetUrl);
      const currentInZone = zone === "start" ? startFrame : endFrame;

      if (currentInZone === assetUrl) {
        setFrame(zone, null);
        toast.success("Removed from frame");
        return;
      }

      const { isValid, sizeInMB } = await checkFileSizeLimit(
        assetUrl,
        sizeString,
        maxFileSizeLimit
      );
      if (!isValid && sizeInMB !== undefined) {
        toast.error(
          `Image size (${sizeInMB.toFixed(
            1
          )}MB) exceeds the limit of ${maxFileSizeLimit}MB`
        );
        return;
      }

      setFrame(zone, assetUrl);
      if (zone === "start") {
        toast.success(`Added to start frame`);
      } else {
        toast.success(`Added to end frame`);
      }

      updateLastAccessed(assetId);

      patchItem({
        itemId: assetId,
        data: { last_accessed_at: new Date().toISOString() },
        revalidateAutofillSuggestions: false,
      });
    },
    [
      activeTab,
      startFrame,
      endFrame,
      maxFileSizeLimit,
      setFrame,
      updateLastAccessed,
      patchItem,
    ]
  );

  const handleDragStart = useCallback(
    (
      e: React.DragEvent,
      assetUrl: string,
      source?: "start" | "end",
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
    async (e: React.DragEvent, zone: "start" | "end") => {
      e.preventDefault();
      const assetUrl = e.dataTransfer.getData("assetUrl");
      const source = e.dataTransfer.getData("source") || "gallery";
      const assetId = e.dataTransfer.getData("assetId");

      // Handle file drops from OS directly to zones
      if (
        (!assetUrl || source === "os") &&
        e.dataTransfer.files &&
        e.dataTransfer.files.length > 0
      ) {
        const files = Array.from(e.dataTransfer.files).filter((f) =>
          f.type.startsWith("image/")
        );
        if (files.length === 0) return;

        if (files.length > 1) {
          toast.warning("Only one frame allowed. Using the first file.");
        }

        const file = files[0];

        if (!fileTypes.includes(file.type)) {
          toast.error(
            `File type ${file.type} not allowed. Allowed: ${fileTypes.join(
              ", "
            )}`
          );
          return;
        }

        const fileSizeMB = await getFileSizeInMB(file);
        if (fileSizeMB > maxFileSizeLimit) {
          toast.error(
            `File size (${fileSizeMB.toFixed(
              1
            )}MB) exceeds limit of ${maxFileSizeLimit}MB`
          );
          return;
        }

        setIsUploading(true);

        try {
          const zoneLabel = `${zone} frame`;
          const uploadedUrl = await uploadFileAndAddToGallery(file);
          toast.promise(Promise.resolve(uploadedUrl), {
            loading: `Uploading to ${zoneLabel}...`,
            success: "File uploaded successfully",
            error: "Failed to upload file. Please try again.",
          });
          setFrame(zone, uploadedUrl);
        } catch (error) {
          console.error("Failed to upload file:", error);
        } finally {
          setIsUploading(false);
        }
        return;
      }

      if (!assetUrl) return;

      if (source === "gallery") {
        // Size check for gallery drop
        const galleryItem = galleryItems.find(
          (item) => item.asset_url === assetUrl
        );
        const { isValid, sizeInMB } = await checkFileSizeLimit(
          assetUrl,
          galleryItem?.size,
          maxFileSizeLimit
        );
        if (!isValid && sizeInMB !== undefined) {
          toast.error(
            `Image size (${sizeInMB.toFixed(
              1
            )}MB) exceeds the limit of ${maxFileSizeLimit}MB`
          );
          return;
        }

        const currentInZone = zone === "start" ? startFrame : endFrame;
        if (currentInZone === assetUrl) {
          toast.info("Already in this frame");
          return;
        }

        setFrame(zone, assetUrl);
        toast.success(`Added to ${zone} frame`);

        // Update last accessed
        if (assetId) {
          updateLastAccessed(assetId);
          patchItem({
            itemId: assetId,
            data: { last_accessed_at: new Date().toISOString() },
            revalidateAutofillSuggestions: false,
          });
        }
      } else {
        // Drop from other zone (move)
        const sourceZone = source as "start" | "end";
        if (sourceZone === zone) {
          toast.info("Already in this frame");
          return;
        }

        setFrame(sourceZone, null);
        setFrame(zone, assetUrl);
        toast.success(`Moved to ${zone} frame`);
      }
    },
    [
      startFrame,
      endFrame,
      maxLimit,
      onStartFrameChange,
      onEndFrameChange,
      updateLastAccessed,
      patchItem,
      galleryItems,
      maxFileSizeLimit,
      uploadFileAndAddToGallery,
      setFrame,
      fileTypes,
      getFileSizeInMB,
    ]
  );

  const handleRemoveImage = useCallback(
    (zone: "start" | "end", url: string) => {
      setFrame(zone, null);
    },
    [setFrame]
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
    (zone: "start" | "end") => async (e: React.ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = extractImageFiles(e.clipboardData.items);
      if (files.length === 0) return;

      if (files.length > 1) {
        toast.warning("Only one frame allowed. Using the first image.");
      }

      const file = files[0];

      if (!fileTypes.includes(file.type)) {
        toast.error(
          `Image type ${file.type} not allowed. Allowed: ${fileTypes.join(
            ", "
          )}`
        );
        return;
      }

      setIsUploading(true);
      try {
        const zoneLabel = `${zone} frame`;
        const uploadedUrl = await uploadFileAndAddToGallery(file);

        toast.promise(Promise.resolve(uploadedUrl), {
          loading: `Pasting to ${zoneLabel}...`,
          success: "Image pasted successfully",
          error: "Failed to paste image.",
        });

        setFrame(zone, uploadedUrl);
      } catch (error) {
        console.error("Clipboard paste failed:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFileAndAddToGallery, extractImageFiles, fileTypes, setFrame]
  );

  const handleDeleteGalleryItem = useCallback(
    (item: GalleryItemResponse) => {
      const url = item.asset_url;
      let cleared = false;

      if (startFrame === url) {
        onStartFrameChange?.(null);
        cleared = true;
      }

      if (endFrame === url) {
        onEndFrameChange?.(null);
        cleared = true;
      }

      if (cleared) {
        toast.success("Removed from frame");
      }

      if (item.asset_source === "reference") {
        deleteItem(item.id);
        const newItems = galleryItems.filter((i) => i.id !== item.id);
        setItems(newItems);
      } else {
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
      startFrame,
      endFrame,
      onStartFrameChange,
      onEndFrameChange,
    ]
  );

  const handleMediaLibrarySelection = useCallback(
    async (items: GalleryItem[]) => {
      // console.log("Media library selected items:", items);
      if (items.length === 0) {
        setMediaLibraryOpen(false);
        return;
      }

      const item = items[0];
      if (item.asset_type == "video") {
        toast.info("Can't upload Video Asset. Coming Soon...");
        return;
      }
      const { isValid, sizeInMB } = await checkFileSizeLimit(
        item.asset_url,
        item.size,
        maxFileSizeLimit
      );

      if (!isValid && sizeInMB !== undefined) {
        toast.error(
          `${item.asset_title || "Image"} (${sizeInMB.toFixed(
            1
          )}MB) exceeds the limit of ${maxFileSizeLimit}MB`
        );
        return;
      }

      // const zone = activeTab as "start" | "end";
      const zone = activeTab === "start_frame" ? "start" : "end";
      const currentInZone = zone === "start" ? startFrame : endFrame;
      if (currentInZone === item.asset_url) {
        toast.info("Already in this frame");
        setMediaLibraryOpen(false);
        return;
      }

      setFrame(zone, item.asset_url);
      toast.success(`Added to ${activeTab} frame`);

      const itemsAsResponse = items.map((item) => ({
        ...item,
      })) as GalleryItemResponse[];
      const itemsWithIds = itemsAsResponse.filter((item) => item.id);

      if (itemsWithIds.length > 0) {
        addItems(itemsWithIds);
      }

      items.forEach((item) => {
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
    },
    [
      activeTab,
      startFrame,
      endFrame,
      onStartFrameChange,
      onEndFrameChange,
      maxFileSizeLimit,
      setFrame,
      updateLastAccessed,
      patchItem,
    ]
  );

  const inSelectionIds = [startFrame || "", endFrame || ""].filter(
    Boolean
  ) as string[];

  // Render popover variant (default)
  return (
    <>
      <div>
        <Popover open={isOpen} onOpenChange={handleOpenChange} modal>
          <PopoverTrigger asChild hidden={!showPopoverTrigger}>
            {customTrigger || (
              <div className="flex gap-4">
                <VideoFrameZone
                  type="start"
                  icon={SkipBack}
                  title="Start Frame"
                  description="Use a start frame image. (Click, drag, or paste to add)"
                  assets={startFrame ? [startFrame] : []}
                  isSelected={activeTab === "start_frame"}
                  onClick={openForStart}
                  onDrop={(e) => handleDropZone(e, "start")}
                  onDragStart={(e, url) => handleDragStart(e, url, "start")}
                  onRemoveImage={(url) => handleRemoveImage("start", url)}
                  showAddButton={!!endFrame}
                  onAddClick={openForStart}
                  onPaste={handleZonePaste("start")}
                />

                {isEndFrameAvailable ? (
                  <VideoFrameZone
                    type="end"
                    icon={SkipForward}
                    title="End Frame"
                    description="Use an end frame image. (Click, drag, or paste to add)"
                    assets={endFrame ? [endFrame] : []}
                    isSelected={activeTab === "end_frame"}
                    onClick={openForEnd}
                    onDrop={(e) => handleDropZone(e, "end")}
                    onDragStart={(e, url) => handleDragStart(e, url, "end")}
                    onRemoveImage={(url) => handleRemoveImage("end", url)}
                    showAddButton={!!startFrame}
                    onAddClick={openForEnd}
                    onPaste={handleZonePaste("end")}
                  />
                ) : (
                  <div className="flex-1 border rounded-xl bg-background cursor-pointer transition-all min-w-0 flex flex-col items-center justify-center text-muted-foreground leading-snug text-sm text-center">
                    End Frame is not available for this model
                  </div>
                )}
              </div>
            )}
          </PopoverTrigger>

          <PopoverContent
            id="reference-zone"
            align={popoverAlign}
            side={popoverSide}
            className="w-[1000px] p-0 rounded-xl max-h-[500px] shadow-xl border bg-background overflow-y-scroll"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
            }}
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
                  {/* Dual mode - show start and end zones */}
                  <div className="flex gap-4">
                    <VideoFrameZone
                      type="start"
                      icon={SkipBack}
                      title="Start Frame"
                      description="Use a start frame image. (Click, drag, or paste to add)"
                      assets={startFrame ? [startFrame] : []}
                      isSelected={activeTab === "start_frame"}
                      onClick={openForStart}
                      onDrop={(e) => handleDropZone(e, "start")}
                      onDragStart={(e, url) => handleDragStart(e, url, "start")}
                      onRemoveImage={(url) => handleRemoveImage("start", url)}
                      showAddButton={!!endFrame}
                      onAddClick={openForStart}
                      onPaste={handleZonePaste("start")}
                    />
                    {isEndFrameAvailable && (
                      <VideoFrameZone
                        type="end"
                        icon={SkipForward}
                        title="End Frame"
                        description="Use an end frame image. (Click, drag, or paste to add)"
                        assets={endFrame ? [endFrame] : []}
                        isSelected={activeTab === "end_frame"}
                        onClick={openForEnd}
                        onDrop={(e) => handleDropZone(e, "end")}
                        onDragStart={(e, url) => handleDragStart(e, url, "end")}
                        onRemoveImage={(url) => handleRemoveImage("end", url)}
                        showAddButton={!!startFrame}
                        onAddClick={openForEnd}
                        onPaste={handleZonePaste("end")}
                      />
                    )}
                  </div>

                  {/* GALLERY SECTION */}
                  <div
                    id="gallery-section"
                    className="overflow-y-auto max-h-[300px] overflow-x-hidden"
                  >
                    <VideoFrameGalleryGrid
                      items={galleryItems}
                      isLoading={isLoadingStore}
                      startFrameUrl={startFrame || undefined}
                      endFrameUrl={endFrame || undefined}
                      onDragStart={(e, assetUrl, assetId) =>
                        handleDragStart(e, assetUrl, undefined, assetId)
                      }
                      onItemClick={handleImageClick}
                      onDeleteItem={handleDeleteGalleryItem}
                      isSingleMode={false}
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
            asset_types: [],
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
          inSelectionGalleryIds={inSelectionIds}
          maxSelectionCount={1}
        />
      </div>
    </>
  );
};

export default VideoFrameSelector;
