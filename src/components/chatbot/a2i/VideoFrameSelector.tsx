import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SkipBack, SkipForward } from "lucide-react";
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
import { allMediaAssetSources, checkFileSizeLimit } from "@/lib/gallery.utils";
import { VideoFrameZone } from "./VideoFrameZone";
import { VideoFrameGalleryGrid } from "./VideoFrameGalleryGrid";
import { useA2iStore } from "@/store/a2i.store";

interface VideoFrameSelectorProps {
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
  activeTab: activeTabProp,
  onTabChange: onTabChangeProp,

  // Common props
  maxLimit,
  fileTypes,
  maxFileSizeLimit,
  maxTotalSizeMB,
  currentCampaignId,
  isOpen,
  onOpenChange,

  // UX Mode props
  popoverAlign = "start",
  popoverSide = "top",
  customTrigger,
  showPopoverTrigger = true,
  isEndFrameAvailable = true,
}: VideoFrameSelectorProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const { addOtherFrame, removeOtherFrame, otherFrames } = useA2iStore();
  console.log("otherFrames in VideoFrameSelector:", otherFrames);

  // UI Toggle State for each zone
  const [selectedTypeFirst, setSelectedTypeFirst] = useState<"start" | "end">(
    "start"
  );
  const [selectedTypeLast, setSelectedTypeLast] = useState<"start" | "end">(
    "start"
  );

  // ---- Extract frames for FIRST zone ----
  const firstZoneFrames = useMemo(
    () => otherFrames.filter((f) => f.zone === "first"),
    [otherFrames]
  );
  const firstStartFrame = firstZoneFrames.find((f) => f.type === "start")?.url;
  const firstEndFrame = firstZoneFrames.find((f) => f.type === "end")?.url;

  // ---- Extract frames for LAST zone ----
  const lastZoneFrames = useMemo(
    () => otherFrames.filter((f) => f.zone === "last"),
    [otherFrames]
  );
  const lastStartFrame = lastZoneFrames.find((f) => f.type === "start")?.url;
  const lastEndFrame = lastZoneFrames.find((f) => f.type === "end")?.url;

  const { startFrame, setStartFrame, endFrame, setEndFrame } = useA2iStore();
  const activeTab = activeTabProp;

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
          asset_types: ["image", "video"],
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
          setStartFrame?.(null);
        } else {
          setEndFrame?.(null);
        }
        return;
      }

      // Clear from other zone if the same URL is there
      const otherZone = zone === "start" ? "end" : "start";
      const otherCurrent = otherZone === "start" ? startFrame : endFrame;
      if (otherCurrent === url) {
        if (otherZone === "start") {
          setStartFrame?.(null);
        } else {
          setEndFrame?.(null);
        }
      }

      // Set to this zone
      if (zone === "start") {
        setStartFrame?.(url);
      } else {
        setEndFrame?.(url);
      }
    },
    [startFrame, endFrame, setStartFrame, setEndFrame]
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
      console.log("Uploading file to gallery:", file.name, file.type);

      const uploadedUrl = await uploadFileAndReturnUrl(
        file.name,
        file.type,
        "brands",
        file,
        selectedBrandId
      );

      const galleryItem: GalleryItem = {
        brand_id: selectedBrandId!,
        asset_type: file.type.startsWith("video") ? "video" : "image",
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
        const zone = activeTab === "start_frame" ? "start" : "end";
        const targetZone = zone === "start" ? "first" : "last";
        const zoneLabel = `${activeTab} frame`;

        // Upload file
        const toastPromise = toast.promise(uploadFileAndAddToGallery(file), {
          loading: `Uploading to ${zoneLabel}...`,
          success: `File uploaded successfully to ${zoneLabel}`,
          error: "Failed to upload file. Please try again.",
        });

        const uploadedUrl = await toastPromise.unwrap();

        // Detect asset type (image vs video)
        const assetType = file.type.startsWith("video") ? "video" : "image";

        if (assetType === "video") {
          // Extract frames
          const { start, end } = await getVideoFrames(uploadedUrl);

          // Set primary frame
          setFrame(zone, start);

          // Add start & end frames to otherFrames store
          addOtherFrame({
            type: "start",
            url: start,
            zone: targetZone,
          });

          addOtherFrame({
            type: "end",
            url: end,
            zone: targetZone,
          });

          toast.success(
            zone === "start"
              ? "Added video start frame"
              : "Added video end frame"
          );
        } else {
          // Image handling
          setFrame(zone, uploadedUrl);
          removeOtherFrame(targetZone); // Clear previous video frames
          toast.success(
            zone === "start" ? "Added to start frame" : "Added to end frame"
          );
        }
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
      addOtherFrame,
      removeOtherFrame,
    ]
  );

  const getVideoFrames = (
    videoUrl: string
  ): Promise<{ start: string; end: string }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.preload = "auto";
      video.src = videoUrl;

      const cleanup = () => {
        video.removeAttribute("src");
        video.load();
      };

      video.onerror = () => {
        cleanup();
        reject("Failed to load video");
      };

      video.onloadedmetadata = () => {
        if (!video.duration || Number.isNaN(video.duration)) {
          cleanup();
          return reject("Invalid video duration");
        }

        // Capture FIRST frame at 0
        video.currentTime = 0;
      };

      let firstFrame: string | null = null;

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          cleanup();
          return reject("Unable to get canvas context");
        }

        ctx.drawImage(video, 0, 0);
        const frameUrl = canvas.toDataURL("image/png");

        // FIRST frame captured → move to LAST
        if (!firstFrame) {
          firstFrame = frameUrl;

          // Seek LAST frame (slightly before end to avoid browser errors)
          video.currentTime = Math.max(video.duration - 0.1, 0);
          return;
        }

        // SECOND seek (last frame)
        const lastFrame = frameUrl;

        cleanup();
        resolve({
          start: firstFrame,
          end: lastFrame,
        });
      };
    });
  };

  const handleItemClick = useCallback(
    async (assetUrl: string, assetId: string, assetType: string) => {
      const zone = activeTab === "start_frame" ? "start" : "end";
      const currentInZone = zone === "start" ? startFrame : endFrame;

      if (currentInZone === assetUrl) {
        setFrame(zone, null);
        toast.success("Removed from frame");
        removeOtherFrame(zone === "start" ? "first" : "last");
        return;
      }

      if (assetType === "video") {
        const { start, end } = await getVideoFrames(assetUrl);

        // Set primary frame
        setFrame(zone, start);

        // Add start & end frame URLs to store
        const targetZone = zone === "start" ? "first" : "last";

        addOtherFrame({
          type: "start",
          url: start,
          zone: targetZone,
        });

        console.log("Adding other frame:", otherFrames);

        addOtherFrame({
          type: "end",
          url: end,
          zone: targetZone,
        });
      } else {
        setFrame(zone, assetUrl);
        removeOtherFrame(zone === "start" ? "first" : "last");
      }

      toast.success(
        zone === "start" ? "Added to start frame" : "Added to end frame"
      );

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
      setFrame,
      updateLastAccessed,
      patchItem,
      addOtherFrame,
      removeOtherFrame,
    ]
  );

  const handleDragStart = useCallback(
    (
      e: React.DragEvent,
      assetUrl: string,
      assetType?: string,
      source?: "start" | "end",
      assetId?: string
    ) => {
      e.dataTransfer.setData("assetUrl", assetUrl);
      e.dataTransfer.setData("source", source || "gallery");
      if (assetType) {
        e.dataTransfer.setData("assetType", assetType);
      }
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
      const assetType = e.dataTransfer.getData("assetType"); // <-- important
      console.log("Drop event data:", { assetUrl, source, assetId, assetType });

      const targetZone = zone === "start" ? "first" : "last";
      const currentInZone = zone === "start" ? startFrame : endFrame;

      if ((!assetUrl || source === "os") && e.dataTransfer.files?.length > 0) {
        const files = Array.from(e.dataTransfer.files).filter(
          (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
        );

        if (files.length === 0) return;
        if (files.length > 1) {
          toast.warning("Only one frame allowed. Using the first file.");
        }

        const file = files[0];
        const isVideo = file.type.startsWith("video");

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
          const uploadedUrl = await uploadFileAndAddToGallery(file);

          if (isVideo) {
            // Extract video frames
            const { start, end } = await getVideoFrames(uploadedUrl);

            setFrame(zone, start);

            addOtherFrame({ type: "start", url: start, zone: targetZone });
            addOtherFrame({ type: "end", url: end, zone: targetZone });
          } else {
            // Image
            setFrame(zone, uploadedUrl);
            removeOtherFrame(targetZone);
          }

          toast.success(`Added to ${zone} frame`);
        } catch (err) {
          console.error("File upload failed:", err);
        } finally {
          setIsUploading(false);
        }
        return;
      }

      if (!assetUrl) return;

      if (source === "gallery") {
        const galleryItem = galleryItems.find(
          (it) => it.asset_url === assetUrl
        );
        const isVideo = assetType === "video";

        // size check
        const { isValid, sizeInMB } = await checkFileSizeLimit(
          assetUrl,
          galleryItem?.size,
          maxFileSizeLimit
        );
        if (!isValid) {
          toast.error(
            `File size (${sizeInMB?.toFixed(
              1
            )}MB) exceeds the limit of ${maxFileSizeLimit}MB`
          );
          return;
        }

        if (currentInZone === assetUrl) {
          toast.info("Already in this frame");
          return;
        }

        if (isVideo) {
          const { start, end } = await getVideoFrames(assetUrl);

          setFrame(zone, start);

          addOtherFrame({ type: "start", url: start, zone: targetZone });
          addOtherFrame({ type: "end", url: end, zone: targetZone });
        } else {
          // Image
          setFrame(zone, assetUrl);
          removeOtherFrame(targetZone);
        }

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

        return;
      }

      if (source === "start" || source === "end") {
        const sourceZone = source as "start" | "end";

        if (sourceZone === zone) {
          toast.info("Already in this frame");
          return;
        }

        const isVideo = assetType === "video";

        // clear old zone
        setFrame(sourceZone, null);
        removeOtherFrame(sourceZone === "start" ? "first" : "last");

        if (isVideo) {
          const { start, end } = await getVideoFrames(assetUrl);

          setFrame(zone, start);

          addOtherFrame({ type: "start", url: start, zone: targetZone });
          addOtherFrame({ type: "end", url: end, zone: targetZone });
        } else {
          setFrame(zone, assetUrl);
          removeOtherFrame(targetZone);
        }

        toast.success(`Moved to ${zone} frame`);
      }
    },
    [
      startFrame,
      endFrame,
      galleryItems,
      maxFileSizeLimit,
      uploadFileAndAddToGallery,
      checkFileSizeLimit,
      getFileSizeInMB,
      setFrame,
      updateLastAccessed,
      patchItem,
      addOtherFrame,
      removeOtherFrame,
      fileTypes,
    ]
  );

  const handleRemoveImage = useCallback(
    (zone: "start" | "end", url: string) => {
      setFrame(zone, null);
      const targetZone = zone === "start" ? "first" : "last";
      removeOtherFrame(targetZone);
    },
    [setFrame, removeOtherFrame]
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
        setStartFrame?.(null);
        cleared = true;
      }

      if (endFrame === url) {
        setEndFrame?.(null);
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
      setStartFrame,
      setEndFrame,
    ]
  );

  const handleMediaLibrarySelection = useCallback(
    async (items: GalleryItem[]) => {
      if (items.length === 0) {
        setMediaLibraryOpen(false);
        return;
      }

      const item = items[0];

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

      const zone = activeTab === "start_frame" ? "start" : "end";
      const targetZone = zone === "start" ? "first" : "last";
      const currentInZone = zone === "start" ? startFrame : endFrame;

      if (currentInZone === item.asset_url) {
        toast.info("Already in this frame");
        setMediaLibraryOpen(false);
        return;
      }

      if (item.asset_type === "video") {
        const { start, end } = await getVideoFrames(item.asset_url);

        // Set primary frame (start)
        setFrame(zone, start);

        // Add additional frames to store
        addOtherFrame({
          type: "start",
          url: start,
          zone: targetZone,
        });

        addOtherFrame({
          type: "end",
          url: end,
          zone: targetZone,
        });

        toast.success(`Added video to ${activeTab} frame`);
      } else {
        setFrame(zone, item.asset_url);

        // Remove any previous video frames
        removeOtherFrame(targetZone);

        toast.success(`Added to ${activeTab} frame`);
      }

      const itemsAsResponse = items.map((it) => ({
        ...it,
      })) as GalleryItemResponse[];
      const itemsWithIds = itemsAsResponse.filter((it) => it.id);

      if (itemsWithIds.length > 0) {
        addItems(itemsWithIds);
      }

      items.forEach((it) => {
        const itRes = it as GalleryItemResponse;
        if (itRes.id) {
          updateLastAccessed(itRes.id);
          patchItem({
            itemId: itRes.id,
            data: { last_accessed_at: new Date().toISOString() },
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
      maxFileSizeLimit,
      setFrame,
      updateLastAccessed,
      patchItem,
      addOtherFrame,
      removeOtherFrame,
    ]
  );

  const inSelectionIds = [startFrame || "", endFrame || ""].filter(
    Boolean
  ) as string[];

  return (
    <>
      <div className="px-2">
        <Popover open={isOpen} onOpenChange={handleOpenChange} modal>
          <PopoverTrigger asChild hidden={!showPopoverTrigger}>
            {customTrigger || (
              <div className="flex gap-4">
                <VideoFrameZone
                  zone="first"
                  icon={SkipBack}
                  title="Start Frame"
                  description="Use a start frame image. (Click, drag, or paste to add)"
                  assets={startFrame ? [startFrame] : []}
                  isSelected={activeTab === "start_frame"}
                  onClick={openForStart}
                  onDrop={(e) => handleDropZone(e, "start")}
                  onDragStart={(e, url, assetType) =>
                    handleDragStart(e, url, assetType, "start")
                  }
                  onRemoveImage={(url) => handleRemoveImage("start", url)}
                  showAddButton={!!endFrame}
                  onAddClick={openForStart}
                  onPaste={handleZonePaste("start")}
                  startFrame={firstStartFrame}
                  endFrame={firstEndFrame}
                  selectedOtherType={selectedTypeFirst}
                  onSelectType={(type) => setSelectedTypeFirst(type)}
                  setFrame={setFrame}
                />

                {isEndFrameAvailable ? (
                  <VideoFrameZone
                    zone="last"
                    icon={SkipForward}
                    title="End Frame"
                    description="Use an end frame image. (Click, drag, or paste to add)"
                    assets={endFrame ? [endFrame] : []}
                    isSelected={activeTab === "end_frame"}
                    onClick={openForEnd}
                    onDrop={(e) => handleDropZone(e, "end")}
                    onDragStart={(e, url, assetType) =>
                      handleDragStart(e, url, assetType, "end")
                    }
                    onRemoveImage={(url) => handleRemoveImage("end", url)}
                    showAddButton={!!startFrame}
                    onAddClick={openForEnd}
                    onPaste={handleZonePaste("end")}
                    // extracted frames for this zone
                    startFrame={lastStartFrame}
                    endFrame={lastEndFrame}
                    selectedOtherType={selectedTypeLast}
                    onSelectType={(type) => setSelectedTypeLast(type)}
                    setFrame={setFrame}
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
                      zone="first"
                      icon={SkipBack}
                      title="Start Frame"
                      description="Use a start frame image. (Click, drag, or paste to add)"
                      assets={startFrame ? [startFrame] : []}
                      isSelected={activeTab === "start_frame"}
                      onClick={openForStart}
                      onDrop={(e) => handleDropZone(e, "start")}
                      onDragStart={(e, url, assetType) =>
                        handleDragStart(e, url, assetType, "start")
                      }
                      onRemoveImage={(url) => handleRemoveImage("start", url)}
                      showAddButton={!!endFrame}
                      onAddClick={openForStart}
                      onPaste={handleZonePaste("start")}
                      startFrame={firstStartFrame}
                      endFrame={firstEndFrame}
                      selectedOtherType={selectedTypeFirst}
                      onSelectType={(type) => setSelectedTypeFirst(type)}
                      setFrame={setFrame}
                    />
                    {isEndFrameAvailable && (
                      <VideoFrameZone
                        zone="last"
                        icon={SkipForward}
                        title="End Frame"
                        description="Use an end frame image. (Click, drag, or paste to add)"
                        assets={endFrame ? [endFrame] : []}
                        isSelected={activeTab === "end_frame"}
                        onClick={openForEnd}
                        onDrop={(e) => handleDropZone(e, "end")}
                        onDragStart={(e, url, assetType) =>
                          handleDragStart(e, url, assetType, "end")
                        }
                        onRemoveImage={(url) => handleRemoveImage("end", url)}
                        showAddButton={!!startFrame}
                        onAddClick={openForEnd}
                        onPaste={handleZonePaste("end")}
                        startFrame={lastStartFrame}
                        endFrame={lastEndFrame}
                        selectedOtherType={selectedTypeLast}
                        onSelectType={(type) => setSelectedTypeLast(type)}
                        setFrame={setFrame}
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
                      onDragStart={(e, assetUrl, assetType, assetId) =>
                        handleDragStart(
                          e,
                          assetUrl,
                          assetType,
                          undefined,
                          assetId
                        )
                      }
                      onItemClick={handleItemClick}
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
