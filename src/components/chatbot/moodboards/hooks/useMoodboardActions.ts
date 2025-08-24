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
    (selectedItems: GalleryItemResponse[], placeholderIndex: number) => {
      setPhotos((prevPhotos) => {
        const updatedPhotos = [...prevPhotos];

        // Replace the specific placeholder or add to a specific position
        if (placeholderIndex < updatedPhotos.length) {
          // Replace placeholder at specific index
          if (selectedItems.length > 0) {
            const item = selectedItems[0]; // Take first item for single placeholder replacement
            updatedPhotos[placeholderIndex] = {
              id: item.id,
              src: item.asset_url,
              width: item.dimensions?.width || 300,
              height: item.dimensions?.height || 300,
              alt: `Image ${item.id}`,
              liked: item.is_favourite || false,
              is_placeholder: false,
            };
          }
        } else {
          // Add to the end if placeholderIndex is beyond current length
          selectedItems.forEach((item) => {
            updatedPhotos.push({
              id: item.id,
              src: item.asset_url,
              width: item.dimensions?.width || 300,
              height: item.dimensions?.height || 300,
              alt: `Image ${item.id}`,
              liked: item.is_favourite || false,
              is_placeholder: false,
            });
          });
        }

        // Check after updating if total exceeds current noOfImagesForMoodboard
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
    let availableItems = autoFillSuggestions.filter(
      (item: AutoFillSuggestedImage) =>
        !photos.some((photo) => photo.id === item.id)
    );

    // Sort so that items with is_favourite === true come first
    availableItems = availableItems.sort(
      (a: AutoFillSuggestedImage, b: AutoFillSuggestedImage) => {
        if (a.is_favourite === b.is_favourite) return 0;
        return a.is_favourite ? -1 : 1;
      }
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
