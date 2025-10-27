import { useCallback } from "react";
import type { Photo } from "react-photo-album";
import type { GalleryItemResponse } from "@/types/gallery.types";
import type { AutoFillSuggestedImage } from "@/types/moodboard.types";
import { SortablePhoto } from "@/components/gallery/CustomGalleryContainer";
import { toast } from "sonner";

interface UseMoodboardActionsProps {
  photos: SortablePhoto<Photo>[];
  setPhotos: React.Dispatch<React.SetStateAction<SortablePhoto<Photo>[]>>;
  setOriginalPhotos: React.Dispatch<
    React.SetStateAction<SortablePhoto<Photo>[]>
  >;
  noOfImagesForMoodboard: number;
  setNoOfImagesForMoodboard: React.Dispatch<React.SetStateAction<number>>;
  galleryActions: any;
  updateAutoFillSuggestionCache: (photoId: string, liked: boolean) => void;
  autoFillSuggestions: AutoFillSuggestedImage[];
  isAutoFillLoading: boolean;
}

export const useMoodboardActions = ({
  photos,
  setPhotos,
  setOriginalPhotos,
  noOfImagesForMoodboard,
  setNoOfImagesForMoodboard,
  galleryActions,
  updateAutoFillSuggestionCache,
  autoFillSuggestions,
  isAutoFillLoading,
}: UseMoodboardActionsProps) => {
  // Local move photo function (no API call)
  const movePhoto = useCallback(
    (oldIndex: number, newIndex: number) => {
      setPhotos((prevPhotos) => {
        const updated = [...prevPhotos];
        [updated[oldIndex], updated[newIndex]] = [
          updated[newIndex],
          updated[oldIndex],
        ];
        // Update positions to match new indices
        updated.forEach((photo, index) => {
          photo.position = index;
        });
        return updated;
      });
    },
    [setPhotos]
  );

  // Direct API call for photo like/dislike
  const onPhotoLike = useCallback(
    async (index: number, liked: boolean) => {
      const photo = photos[index];

      // Optimistically update the UI
      setPhotos((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], liked };
        return updated;
      });

      setOriginalPhotos((prev) => {
        const updated = [...prev];
        const originalIndex = updated.findIndex((p) => p.id === photo.id);
        if (originalIndex !== -1) {
          updated[originalIndex] = { ...updated[originalIndex], liked };
        }
        return updated;
      });

      // Optimistically update the autofill cache
      updateAutoFillSuggestionCache(photo.id, liked);

      try {
        await galleryActions.patchItem({
          itemId: photo.id,
          data: {
            is_favourite: liked,
          },
        });
      } catch (error) {
        console.error("Failed to update photo like status:", error);

        // Revert the optimistic update on error
        setPhotos((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], liked: !liked };
          return updated;
        });

        setOriginalPhotos((prev) => {
          const updated = [...prev];
          const originalIndex = updated.findIndex((p) => p.id === photo.id);
          if (originalIndex !== -1) {
            updated[originalIndex] = {
              ...updated[originalIndex],
              liked: !liked,
            };
          }
          return updated;
        });

        // Revert the autofill cache update on error
        updateAutoFillSuggestionCache(photo.id, !liked);
      }
    },
    [
      photos,
      setPhotos,
      setOriginalPhotos,
      updateAutoFillSuggestionCache,
      galleryActions,
    ]
  );

  // Handle gallery selection for placeholder replacement
  const handleGallerySelection = useCallback(
    (selectedItems: GalleryItemResponse[], placeHolderIndex?: number) => {
      if (!selectedItems || selectedItems.length === 0) return;

      setPhotos((prevPhotos) => {
        const updatedPhotos = [...prevPhotos];

        // If a specific placeholder index is provided, replace that specific placeholder
        if (placeHolderIndex !== undefined) {
          // Check if the specified index is valid and is a placeholder
          if (
            placeHolderIndex >= 0 &&
            placeHolderIndex < updatedPhotos.length &&
            updatedPhotos[placeHolderIndex].is_placeholder
          ) {
            // Replace the specific placeholder with the first selected item
            const item = selectedItems[0];
            updatedPhotos[placeHolderIndex] = {
              id: item.id,
              src: item.asset_url,
              width: item.dimensions?.width || 300,
              height: item.dimensions?.height || 300,
              alt: `Image ${item.id}`,
              liked: item.is_favourite || false,
              is_placeholder: false,
              position: placeHolderIndex,
            };

            // If there are more selected items, add them to the first available placeholders
            if (selectedItems.length > 1) {
              const remainingItems = selectedItems.slice(1);
              const otherPlaceholderIndices = updatedPhotos
                .map((photo, index) => ({ photo, index }))
                .filter(
                  ({ photo, index }) =>
                    photo.is_placeholder && index !== placeHolderIndex
                )
                .map(({ index }) => index);

              remainingItems
                .slice(0, otherPlaceholderIndices.length)
                .forEach((remainingItem: GalleryItemResponse, idx: number) => {
                  const targetIndex = otherPlaceholderIndices[idx];
                  updatedPhotos[targetIndex] = {
                    id: remainingItem.id,
                    src: remainingItem.asset_url,
                    width: remainingItem.dimensions?.width || 300,
                    height: remainingItem.dimensions?.height || 300,
                    alt: `Image ${remainingItem.id}`,
                    liked: remainingItem.is_favourite || false,
                    is_placeholder: false,
                    position: targetIndex,
                  };
                });

              // If there are still more items than placeholders, append to end
              if (remainingItems.length > otherPlaceholderIndices.length) {
                remainingItems
                  .slice(otherPlaceholderIndices.length)
                  .forEach((remainingItem: GalleryItemResponse) => {
                    updatedPhotos.push({
                      id: remainingItem.id,
                      src: remainingItem.asset_url,
                      width: remainingItem.dimensions?.width || 300,
                      height: remainingItem.dimensions?.height || 300,
                      alt: `Image ${remainingItem.id}`,
                      liked: remainingItem.is_favourite || false,
                      is_placeholder: false,
                      position: updatedPhotos.length,
                    });
                  });
              }
            }
          }
        } else {
          // Original logic: Find placeholder items to fill (same simple logic as autofill)
          const placeholderIndices = updatedPhotos
            .map((photo, index) => ({ photo, index }))
            .filter(({ photo }) => photo.is_placeholder)
            .map(({ index }) => index);

          // Fill placeholders with selected items (same simple logic as autofill)
          selectedItems
            .slice(0, placeholderIndices.length)
            .forEach((item: GalleryItemResponse, idx: number) => {
              const targetIndex = placeholderIndices[idx];
              updatedPhotos[targetIndex] = {
                id: item.id,
                src: item.asset_url,
                width: item.dimensions?.width || 300,
                height: item.dimensions?.height || 300,
                alt: `Image ${item.id}`,
                liked: item.is_favourite || false,
                is_placeholder: false,
                position: targetIndex,
              };
            });

          // If there are more selected items than placeholders, append to end
          if (selectedItems.length > placeholderIndices.length) {
            selectedItems
              .slice(placeholderIndices.length)
              .forEach((item: GalleryItemResponse) => {
                updatedPhotos.push({
                  id: item.id,
                  src: item.asset_url,
                  width: item.dimensions?.width || 300,
                  height: item.dimensions?.height || 300,
                  alt: `Image ${item.id}`,
                  liked: item.is_favourite || false,
                  is_placeholder: false,
                  position: updatedPhotos.length,
                });
              });
          }
        }

        // Update noOfImagesForMoodboard if needed
        const newTotal = updatedPhotos.filter(
          (photo) => !photo.is_placeholder
        ).length;
        if (newTotal > noOfImagesForMoodboard) {
          setNoOfImagesForMoodboard(newTotal);
        }

        return updatedPhotos;
      });
    },
    [noOfImagesForMoodboard, setNoOfImagesForMoodboard, setPhotos]
  );

  // AutoFill placeholders with suggested images
  const autoFillPlaceholders = useCallback(() => {
    if (isAutoFillLoading) {
      toast.warning("AutoFill suggestions are still loading...");
      return;
    }

    if (!autoFillSuggestions || autoFillSuggestions.length === 0) {
      toast.warning("No suggested images available. Please try again later.");
      return;
    }

    // Filter out images that are already in the moodboard
    const availableItems = autoFillSuggestions.filter(
      (item: AutoFillSuggestedImage) =>
        !photos.some((photo) => photo.id === item.id)
    );

    if (availableItems.length === 0) {
      toast.warning("All suggested images are already in your moodboard.");
      return;
    }

    setPhotos((prevPhotos) => {
      const updatedPhotos = [...prevPhotos];

      // Find placeholder items to fill
      const placeholderIndices = updatedPhotos
        .map((photo, index) => ({ photo, index }))
        .filter(({ photo }) => photo.is_placeholder)
        .map(({ index }) => index);

      availableItems
        .slice(0, placeholderIndices.length)
        .forEach((item: AutoFillSuggestedImage, idx: number) => {
          const targetIndex = placeholderIndices[idx];
          updatedPhotos[targetIndex] = {
            id: item.id,
            src: item.asset_url,
            width: item.dimensions?.width || 300,
            height: item.dimensions?.height || 300,
            alt: `Image ${item.id}`,
            liked: item.is_favourite || false,
            is_placeholder: false,
            position: targetIndex,
          };
        });

      return updatedPhotos;
    });

    const placeholderCount = photos.filter(
      (photo) => photo.is_placeholder
    ).length;
    toast.success(
      `Added ${Math.min(
        availableItems.length,
        placeholderCount
      )} suggested images to your moodboard.`
    );
  }, [isAutoFillLoading, autoFillSuggestions, photos, setPhotos]);

  return {
    movePhoto,
    onPhotoLike,
    handleGallerySelection,
    autoFillPlaceholders,
  };
};
