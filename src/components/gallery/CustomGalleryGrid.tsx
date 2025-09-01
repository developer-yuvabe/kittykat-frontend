import type React from "react";
import { forwardRef, useImperativeHandle, useRef } from "react";
import type { Photo } from "react-photo-album";
import type { MoodboardInformation } from "@/types/types";
import type { GalleryItemResponse } from "@/types/gallery.types";
import type { UnifiedMoodboardItem } from "@/types/moodboard.types";
import { CustomGalleryPlaceholderCard } from "./CustomGalleryPlaceholderCard";
import { CustomGalleryGridItem } from "./CustomGalleryGridItem";
import type { SortablePhoto } from "./CustomGalleryContainer";
import { GalleryActions } from "@/hooks/useGallery";
import html2canvas from "html2canvas-pro";
import { useBrandStore } from "@/store/brand.store";
import Logo from "../shared/Logo";

// Ref interface for screenshot functionality
export interface CustomGalleryGridRef {
  captureScreenshot: () => Promise<string | null>;
}

type GridLayout = {
  containerClass: string;
  positions: Array<{ gridArea: string }>;
};

interface CustomGalleryGridProps<TPhoto extends Photo> {
  allItems: UnifiedMoodboardItem[];
  photos: SortablePhoto<TPhoto>[];
  layout: GridLayout | undefined;
  containerHeight: number;
  noOfImagesForMoodboard: number;
  moodboard: MoodboardInformation;
  onGallerySelection?: (
    selectedItems: GalleryItemResponse[],
    placeHolderIndex: number
  ) => void;
  onPhotoLike?: (index: number, liked: boolean) => void;
  hasUnsavedChanges?: boolean;
  handleExpandImage: (photo: SortablePhoto<TPhoto>) => void;
  isDraggable: boolean;
  isAtMinimum: boolean;
  setItems: React.Dispatch<React.SetStateAction<UnifiedMoodboardItem[]>>;
  minImagesRequired: number;
  setNoOfImagesForMoodboard: React.Dispatch<React.SetStateAction<number>>;
  showLiked?: boolean;
  isPreview?: boolean;
  galleryActions?: GalleryActions;
}

export const CustomGalleryGrid = forwardRef<
  CustomGalleryGridRef,
  CustomGalleryGridProps<any>
>(
  (
    {
      allItems,
      photos,
      layout,
      containerHeight,
      noOfImagesForMoodboard,
      moodboard,
      onGallerySelection,
      onPhotoLike,
      hasUnsavedChanges,
      handleExpandImage,
      isDraggable,
      setItems,
      minImagesRequired,
      setNoOfImagesForMoodboard,
      showLiked,
      isPreview,
      galleryActions,
    },
    ref
  ) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const screenshotContainerRef = useRef<HTMLDivElement>(null);

    // Get brand store data
    const { getSelectedBrandName, getSelectedCampaignName } = useBrandStore();

    // Expose the screenshot function via ref
    useImperativeHandle(
      ref,
      () => ({
        captureScreenshot: async (): Promise<string | null> => {
          if (!screenshotContainerRef.current) {
            console.warn(
              "Screenshot container ref not available for screenshot"
            );
            return null;
          }

          try {
            // Wait for images to load
            const images =
              screenshotContainerRef.current.querySelectorAll("img");
            await Promise.all(
              Array.from(images).map(
                (img) =>
                  new Promise((resolve) => {
                    if (img.complete) resolve(true);
                    else {
                      img.onload = () => resolve(true);
                      img.onerror = () => resolve(true); // Continue even if image fails
                    }
                  })
              )
            );

            const canvas = await html2canvas(screenshotContainerRef.current, {
              useCORS: true,
              allowTaint: true,
              scale: 2,
              backgroundColor: "#ffffff",
              logging: false, // Disable console logs in production
            });

            return canvas.toDataURL("image/png");
          } catch (error) {
            console.error("Failed to capture screenshot:", error);
            return null;
          }
        },
      }),
      [screenshotContainerRef]
    );

    const handlePhotoLike = async (index: number, liked: boolean) => {
      if (onPhotoLike) {
        onPhotoLike(index, liked);
      }
    };

    const handleRemovePhoto = (id: string) => {
      const item = allItems.find((item) => item.id === id);
      if (!item || item.is_placeholder) return;

      if (photos.length <= minImagesRequired) {
        return;
      }

      setItems((prevItems) => {
        return prevItems.map((prevItem) => {
          if (prevItem.id === id) {
            // Replace image with placeholder at same position
            return {
              id: `placeholder-${prevItem.position}`,
              width: 300,
              height: 300,
              is_placeholder: true,
              position: prevItem.position,
              alt: `Placeholder ${prevItem.position + 1}`,
            };
          }
          return prevItem;
        });
      });
    };

    return (
      <>
        {/* Regular grid for UI interaction */}
        <div
          ref={gridRef}
          className={`w-full gap-1 grid ${layout?.containerClass} transition-opacity duration-200`}
          style={{ height: `${containerHeight}px` }}
        >
          {allItems.map((item, index) => {
            const position = layout?.positions[index];
            if (!position) return null;

            if (item.is_placeholder) {
              return (
                <div
                  key={item?.id || index}
                  style={{ gridArea: position.gridArea }}
                  className="relative overflow-hidden"
                >
                  <CustomGalleryPlaceholderCard
                    photos={photos}
                    allItems={allItems}
                    noOfImagesForMoodboard={noOfImagesForMoodboard}
                    moodboard={moodboard}
                    onGallerySelection={onGallerySelection}
                    placeHolderIndex={index}
                    placeholderItemId={item.id}
                    setItems={setItems}
                    setNoOfImagesForMoodboard={setNoOfImagesForMoodboard}
                    isPreview={isPreview}
                    key={item.id}
                    galleryActions={galleryActions}
                  />
                </div>
              );
            } else {
              return (
                <div
                  key={item?.id || index}
                  style={{ gridArea: position.gridArea }}
                  className="relative overflow-hidden"
                >
                  <CustomGalleryGridItem
                    photo={item as SortablePhoto<any>}
                    index={index}
                    onPhotoLike={handlePhotoLike}
                    removedPhoto={handleRemovePhoto}
                    hasUnsavedChanges={hasUnsavedChanges}
                    handleExpandImage={handleExpandImage}
                    isDraggable={isDraggable}
                    setItems={setItems}
                    showLiked={showLiked}
                    isPreview={!isDraggable}
                    moodboard={moodboard}
                  />
                </div>
              );
            }
          })}
        </div>

        {/* Hidden screenshot container with full layout */}
        <div
          ref={screenshotContainerRef}
          className="fixed top-[-9999px] left-[-9999px] bg-white w-[1200px] p-[30px]"
        >
          {/* Header Section */}
          <div className="flex flex-col items-center mb-12">
            {/* Logo */}
            <div className="mb-6">
              <Logo height={240} width={240} />
            </div>

            {/* Brand - Campaign - Moodboard Names */}
            <div className="text-center">
              <h2 className="text-2xl font-medium text-gray-800">
                {[
                  getSelectedBrandName(),
                  getSelectedCampaignName(),
                  moodboard?.title,
                ]
                  .filter(Boolean)
                  .join(" - ") || "Untitled Moodboard"}
              </h2>
            </div>
          </div>

          {/* Images Grid Section */}
          <div className="mb-12">
            <div
              className={`w-full gap-2 grid ${layout?.containerClass} transition-opacity duration-200`}
              style={{
                height: `${containerHeight}px`,
                maxWidth: "1080px", // Constrain grid width
                margin: "0 auto", // Center the grid
              }}
            >
              {allItems.map((item, index) => {
                const position = layout?.positions[index];
                if (!position) return null;

                if (item.is_placeholder) {
                  return (
                    <div
                      key={item?.id || index}
                      style={{ gridArea: position.gridArea }}
                      className="relative overflow-hidden bg-gray-200  flex items-center justify-center"
                    ></div>
                  );
                } else {
                  return (
                    <div
                      key={item?.id || index}
                      style={{ gridArea: position.gridArea }}
                      className="relative overflow-hidden"
                    >
                      <img
                        src={item.src}
                        alt={item.alt || ""}
                        className="w-full h-full object-cover"
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "block",
                        }}
                      />
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* Footer Section */}
          <div className="text-center">
            <p className="text-lg text-gray-600 font-medium">ask.kittykat.ai</p>
          </div>
        </div>
      </>
    );
  }
);

CustomGalleryGrid.displayName = "CustomGalleryGrid";
