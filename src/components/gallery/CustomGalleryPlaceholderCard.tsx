"use client";

import type React from "react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

import {
  type GalleryItemResponse,
  type GalleryItem,
  type BulkGalleryUploadRequest,
  IMAGE_FILE_TYPES,
} from "@/types/gallery.types";
import type { AutoFillSuggestedImage } from "@/types/moodboard.types";
import type { UnifiedMoodboardItem } from "@/types/moodboard.types";
import type { Photo } from "react-photo-album";
import { useBrandStore } from "@/store/brand.store";
import { MoodboardGallerySelector } from "../chatbot/moodboards/MoodboardGallerySelector";
import type { MoodboardInformation } from "@/types/types";
import type { SortablePhoto } from "./CustomGalleryContainer";
import { Button } from "../ui/button";
import { RegenerateIcon } from "../ui/custom-icon";
import { GalleryActions } from "@/hooks/useGallery";
import { toast } from "sonner";
import { HeartIcon, Loader2, X, Upload } from "lucide-react";
import { useMoodboardQuery } from "@/hooks/useMoodboardQuery";
import Sortable from "./Sortable";
import {
  usePlaceholderDroppable,
  useCarouselDnd,
} from "@/contexts/CarouselDndContext";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { getExtensionFromUrl } from "@/lib/utils";

type PlaceholderCardProps<TPhoto extends Photo> = {
  photos: SortablePhoto<TPhoto>[];
  allItems: UnifiedMoodboardItem[];
  noOfImagesForMoodboard: number;
  moodboard: MoodboardInformation;
  onGallerySelection?: (
    selectedItems: GalleryItemResponse[],
    placeHolderIndex: number
  ) => void;
  placeHolderIndex: number;
  placeholderItemId?: string;
  setItems: React.Dispatch<React.SetStateAction<UnifiedMoodboardItem[]>>;
  setNoOfImagesForMoodboard: React.Dispatch<React.SetStateAction<number>>;
  isPreview?: boolean;
  galleryActions?: GalleryActions;
};

export function CustomGalleryPlaceholderCard<TPhoto extends Photo>({
  photos,
  allItems,
  noOfImagesForMoodboard,
  moodboard,
  onGallerySelection,
  placeHolderIndex,
  placeholderItemId,
  setItems,
  setNoOfImagesForMoodboard,
  isPreview = false,
  galleryActions,
}: PlaceholderCardProps<TPhoto>) {
  const { selectedBrandId } = useBrandStore();

  // File upload state
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isFileDragActive, setIsFileDragActive] = useState(false);

  // Droppable functionality for drag-and-drop from carousel
  const {
    setNodeRef: setDroppableRef,
    isDraggedOver,
    isDragging,
  } = usePlaceholderDroppable(placeHolderIndex);

  // Get carousel context to distinguish between carousel and sortable dragging
  const carouselContext = useCarouselDnd();
  const isDraggingCarouselItem =
    carouselContext?.isDraggingCarouselItem || false;

  const { data: autoFillSuggestions = [], isLoading: isAutoFillLoading } =
    useMoodboardQuery({
      brandId: selectedBrandId || undefined,
      campaignId: moodboard?.campaign_id,
      moodboardId: moodboard?.id,
      count: 50,
    });

  const autoFillPlaceholders = useCallback(() => {
    if (isAutoFillLoading) {
      toast.warning("AutoFill suggestions are still loading...");
      return;
    }

    if (!autoFillSuggestions || autoFillSuggestions.length === 0) {
      toast.warning("No suggested images available. Please try again later.");
      return;
    }

    const availableItems = autoFillSuggestions.filter(
      (item: AutoFillSuggestedImage) =>
        !photos.some((photo) => photo.id === item.id)
    );

    if (availableItems.length === 0) {
      toast.warning("All suggested images are already in your moodboard.");
      return;
    }

    const item = availableItems[0];

    setItems((prevItems) => {
      return prevItems.map((prevItem) => {
        if (prevItem.position === placeHolderIndex && prevItem.is_placeholder) {
          return {
            id: item.id,
            src: item.asset_url,
            width: item.dimensions?.width || 300,
            height: item.dimensions?.height || 300,
            alt: `Image ${item.id}`,
            liked: item.is_favourite || false,
            is_placeholder: false,
            position: placeHolderIndex,
          };
        }
        return prevItem;
      });
    });

    toast.success("Added suggested image to your moodboard.");
  }, [
    isAutoFillLoading,
    autoFillSuggestions,
    photos,
    setItems,
    placeHolderIndex,
  ]);

  // File upload handler
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!Object.keys(IMAGE_FILE_TYPES).includes(file.type)) {
        toast.error("Only image files are supported.");
        return;
      }

      try {
        // First show loading state on the placeholder
        setItems((prevItems) => {
          return prevItems.map((prevItem) => {
            if (
              prevItem.position === placeHolderIndex &&
              prevItem.is_placeholder
            ) {
              return {
                ...prevItem,
                isUploading: true,
              };
            }
            return prevItem;
          });
        });

        // Upload file to GCS
        const uploadedUrl = await uploadFileAndReturnUrl(
          file.name,
          file.type,
          "brands",
          file,
          selectedBrandId,
          moodboard?.campaign_id || null
        );

        // Create gallery item
        const galleryItem: GalleryItem = {
          brand_id: selectedBrandId!,
          asset_url: uploadedUrl,
          asset_title: file.name,
          asset_type: "image",
          asset_source: "brand-uploads",
          size: `${file.size}`,
          search_keywords: [],
          custom_tags: [],
          related_asset_ids: [],
          prompt_modifiers: [],
          ai_tags: [],
          visual_style_tags: {},
          detected_objects: [],
          detected_emotions: [],
          detected_colors: [],
          media_format: getExtensionFromUrl(uploadedUrl),
          campaign_id: moodboard?.campaign_id,
          moodboard_id: moodboard?.id,
          is_master: true,
        };

        // Add to gallery using bulk upload
        const bulkUploadPayload: BulkGalleryUploadRequest = {
          gallery_items: [galleryItem],
          brand_id: selectedBrandId!,
          moodboard_id: moodboard?.id,
          campaign_id: moodboard?.campaign_id,
        };

        const uploadResults = await galleryActions?.bulkUpload(
          bulkUploadPayload
        );

        if (!uploadResults || uploadResults.length === 0) {
          throw new Error("No upload results returned from gallery upload.");
        }

        const uploadedItem = uploadResults[0];
        // Replace placeholder with uploaded image
        setItems((prevItems) => {
          return prevItems.map((prevItem) => {
            if (
              prevItem.position === placeHolderIndex &&
              prevItem.is_placeholder
            ) {
              return {
                id: uploadedItem.id,
                src: uploadedItem.asset_url,
                width: uploadedItem.dimensions?.width || 300,
                height: uploadedItem.dimensions?.height || 300,
                alt: `Image ${uploadedItem.id}`,
                liked: uploadedItem.is_favourite || false,
                is_placeholder: false,
                position: placeHolderIndex,
                isUploading: false,
              };
            }
            return prevItem;
          });
        });

        toast.success("Image uploaded and added to gallery successfully!");
      } catch (error) {
        console.error("File upload failed:", error);
        toast.error("Failed to upload image. Please try again.");

        // Remove loading state on error
        setItems((prevItems) => {
          return prevItems.map((prevItem) => {
            if (prevItem.position === placeHolderIndex) {
              return {
                ...prevItem,
                isUploading: false,
              };
            }
            return prevItem;
          });
        });
      } finally {
        setIsFileUploading(false);
      }
    },
    [
      selectedBrandId,
      moodboard,
      placeHolderIndex,
      setItems,
      galleryActions,
      IMAGE_FILE_TYPES,
    ]
  );

  // React Dropzone setup
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setIsFileUploading(true);
      setIsFileDragActive(false);
      if (acceptedFiles.length > 0 && !isFileUploading && !isPreview) {
        handleFileUpload(acceptedFiles[0]);
      }
    },
    onDragOver: (e) => {
      // Only prevent default for file drops, not internal drag operations
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
        e.stopPropagation();
        setIsFileDragActive(true);
      }
    },
    onDragEnter: (e) => {
      // Only prevent default for file drops, not internal drag operations
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
        e.stopPropagation();
        setIsFileDragActive(true);
      }
    },
    onDragLeave: (e) => {
      // Prevent event bubbling for cleaner drag state management
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
        e.stopPropagation();
        // Use a small delay to prevent flickering when moving between child elements
        setTimeout(() => setIsFileDragActive(false), 50);
      }
    },
    accept: IMAGE_FILE_TYPES,
    multiple: false,
    disabled: isFileUploading || isPreview,
    noClick: true,
    noKeyboard: true,
  });

  // Get current placeholder item to check upload state from allItems array
  const currentPlaceholderItem = allItems.find(
    (item) => item.position === placeHolderIndex && item.is_placeholder
  );
  const isCurrentlyUploading = currentPlaceholderItem?.isUploading || false;

  const placeholderContent = (
    <div
      {...getRootProps()}
      className={`relative group w-full h-full transition-all duration-300 ${
        isDraggedOver
          ? "bg-gray-100 border-2 border-gray-400 border-dashed"
          : isDragActive || isFileDragActive
          ? "bg-blue-50 border-2 border-blue-300 border-dashed"
          : "bg-neutral-300 hover:bg-neutral-400"
      } ${
        isDraggingCarouselItem &&
        !isDraggedOver &&
        !isDragActive &&
        !isFileDragActive
          ? "opacity-60 border-2 border-dashed border-gray-400"
          : ""
      } flex flex-col items-center justify-center cursor-pointer`}
    >
      <input {...getInputProps()} />

      {/* Drop zone indicator - for carousel items */}
      {isDraggedOver &&
        !isCurrentlyUploading &&
        !isDragActive &&
        !isFileDragActive && (
          <div className="absolute inset-0 bg-gray-500/10 flex items-center justify-center z-50 pointer-events-none rounded-md">
            <div className="bg-gray-600 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2">
              <Upload size={16} />
              Drop image here
            </div>
          </div>
        )}

      {/* Drop zone indicator - for file uploads */}
      {(isDragActive || isFileDragActive) &&
        !isDraggedOver &&
        !isCurrentlyUploading && (
          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center z-50 pointer-events-none rounded-md">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2">
              <Upload size={16} />
              Drop file to upload
            </div>
          </div>
        )}

      <div className="absolute inset-0 bg-gradient-to-b from-[#A1A8B3FF] via-transparent to-[#A1A8B3FF] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Draggable bar on top middle */}
      {!isPreview && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-16 h-1 bg-white rounded-full cursor-grab hover:w-20 transition-all opacity-60 hover:opacity-100" />
        </div>
      )}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-200 pointer-events-none ${
          isCurrentlyUploading || isDragActive || isFileDragActive
            ? "opacity-0"
            : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {!isPreview &&
          !isCurrentlyUploading &&
          !isDragActive &&
          !isFileDragActive &&
          !isFileUploading && (
            <div className="flex flex-col items-center justify-center gap-0 pointer-events-auto z-50">
              <Button
                size="lg"
                className="rounded-b-none w-28 hover:opacity-90"
                disabled={isAutoFillLoading || isFileUploading}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  autoFillPlaceholders();
                }}
              >
                {isAutoFillLoading ? (
                  <>
                    <span className="mr-2">Autofill</span>
                    <Loader2 className="animate-spin text-white" />
                  </>
                ) : (
                  <>
                    <RegenerateIcon color="white" />
                    <span>Autofill</span>
                  </>
                )}
              </Button>

              <div className="pointer-events-auto z-50">
                <MoodboardGallerySelector
                  brandId={selectedBrandId!}
                  campaignId={moodboard.campaign_id}
                  moodboardId={moodboard.id}
                  hasUnsavedChanges={false}
                  inSelectionGalleryIds={photos.map((photo) => photo.id)}
                  noOfImagesForMoodboard={noOfImagesForMoodboard}
                  onGallerySelection={onGallerySelection}
                  placeHolderIndex={placeHolderIndex}
                />
              </div>
            </div>
          )}
      </div>

      {(isFileUploading || isCurrentlyUploading) && (
        <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
          <Loader2 className="animate-spin" size={16} />
          Uploading...
        </div>
      )}

      {!isPreview &&
        !isDragging &&
        !isCurrentlyUploading &&
        !isDragActive &&
        !isFileDragActive && (
          <>
            <div className="absolute top-2 right-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
              <X
                size={16}
                className="w-5 h-5 cursor-pointer transition-all duration-200 text-white fill-white hover:scale-110 active:scale-95"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  if (noOfImagesForMoodboard <= 10) {
                    toast.warning("At least 10 images are required.");
                    return;
                  }

                  setNoOfImagesForMoodboard((prev) => prev - 1);
                  setItems((prev) => {
                    return prev.filter(
                      (item) => item.position !== placeHolderIndex
                    );
                  });
                }}
              />
            </div>

            <div className="absolute bottom-2 right-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
              <HeartIcon
                size={16}
                className="w-5 h-5 cursor-pointer transition-all duration-200 text-white hover:scale-110 active:scale-95"
              />
            </div>
          </>
        )}
    </div>
  );

  return (
    <Sortable
      id={placeholderItemId || `placeholder-${placeHolderIndex}`}
      droppableRef={setDroppableRef}
    >
      {placeholderContent}
    </Sortable>
  );
}
