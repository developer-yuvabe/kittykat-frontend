import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { galleryService } from "@/services/api/gallery.service";
import { UnifiedMoodboardItem } from "@/types/moodboard.types";
import { MoodboardAsset, MoodboardInformation } from "@/types/types";
import { GalleryItemResponse } from "@/types/gallery.types";
import { MIN_IMAGES_REQUIRED } from "@/lib/moodboard.utils";

export const useReferenceMoodboardData = (
  referenceMoodboardId: string | null,
  referenceMoodboardAssets: MoodboardAsset[] | null,
  moodboardInformation: MoodboardInformation[] | undefined
) => {
  const [items, setItems] = useState<UnifiedMoodboardItem[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedMoodboard = useMemo(
    () => moodboardInformation?.find((mb) => mb.id === referenceMoodboardId),
    [moodboardInformation, referenceMoodboardId]
  );

  const assets = useMemo(() => {
    return referenceMoodboardAssets || [];
  }, [referenceMoodboardAssets]);

  // Create a stable key for tracking asset changes
  const assetsKey = useMemo(() => {
    if (!assets || assets.length === 0) {
      return "empty";
    }
    return assets
      .map((asset) => `${asset.gallery_item_id}-${asset.position}`)
      .sort()
      .join("|");
  }, [assets]);

  // Extract gallery item IDs from reference moodboard assets only
  const galleryItemIds = useMemo(() => {
    if (assets && assets.length > 0) {
      return assets.map((asset) => asset.gallery_item_id);
    }
    return [];
  }, [assets]);

  // Get only non-placeholder IDs for API call
  const nonPlaceholderIds = useMemo(() => {
    return galleryItemIds.filter((id) => !String(id).startsWith("placeholder"));
  }, [galleryItemIds]);

  // Fetch only the required gallery items using bulk API
  const {
    data: bulkGalleryItems = [],
    isLoading: isBulkLoading,
    isFetching: isBulkFetching,
  } = useQuery({
    queryKey: ["gallery-items-bulk", nonPlaceholderIds],
    queryFn: () =>
      galleryService.getGalleryItemsBulk({ ids: nonPlaceholderIds }),
    enabled: nonPlaceholderIds.length > 0,
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });

  // Calculate the actual number of images for this moodboard
  const noOfImagesForMoodboard = useMemo(() => {
    if (!assets || assets.length === 0) {
      return MIN_IMAGES_REQUIRED;
    }
    const maxPosition = Math.max(
      ...assets.map((asset) => asset.position || 0),
      -1
    );
    const calculatedCount = maxPosition + 1;
    return Math.max(calculatedCount, MIN_IMAGES_REQUIRED);
  }, [assets]);

  // Helper function to create a placeholder photo
  const createPlaceholderPhoto = useCallback(
    (id: string, position: number): UnifiedMoodboardItem => {
      return {
        id,
        src: "",
        width: 300,
        height: 300,
        alt: `Placeholder ${position + 1}`,
        liked: false,
        is_placeholder: true,
        position,
      };
    },
    []
  );

  // Function to process moodboard assets into items
  const processAssetsToItems = useCallback(
    (
      assetsToProcess: any[],
      galleryItems: GalleryItemResponse[]
    ): UnifiedMoodboardItem[] => {
      if (!assetsToProcess || assetsToProcess.length === 0) return [];

      const itemsToLoad = assetsToProcess
        .map((asset) => {
          // Check if this is a placeholder
          if (String(asset.gallery_item_id).startsWith("placeholder")) {
            return {
              id: asset.gallery_item_id,
              src: "",
              position: asset.position || 0,
              width: 300,
              height: 300,
              is_placeholder: true,
              is_liked: false,
            };
          }

          const galleryItem = galleryItems.find(
            (item) => item.id === asset.gallery_item_id
          );

          // If gallery item is not found, render as placeholder
          if (!galleryItem) {
            return {
              id: `placeholder-${asset.position || 0}`,
              src: "",
              position: asset.position || 0,
              width: 300,
              height: 300,
              is_placeholder: true,
              is_liked: false,
            };
          }

          return {
            id: asset.gallery_item_id,
            src: galleryItem.asset_url || "",
            position: asset.position || 0,
            width: galleryItem.dimensions?.width || 300,
            height: galleryItem.dimensions?.height || 300,
            is_placeholder: false,
            is_liked: galleryItem.is_favourite || false,
          };
        })
        .filter((item) => item !== null);

      return itemsToLoad
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          id: item.id,
          src: item.src,
          width: item.width,
          height: item.height,
          alt: `Image ${item.id}`,
          liked: item.is_liked,
          is_placeholder: item.is_placeholder,
          position: item.position,
        }));
    },
    []
  );

  // Function to fill missing positions with placeholders
  const fillWithPlaceholders = useCallback(
    (
      loadedItems: UnifiedMoodboardItem[],
      targetCount: number
    ): UnifiedMoodboardItem[] => {
      const result: UnifiedMoodboardItem[] = [];

      // Create array with all positions filled
      for (let i = 0; i < targetCount; i++) {
        const existingItem = loadedItems.find((item) => item.position === i);
        if (existingItem) {
          result.push(existingItem);
        } else {
          // Create placeholder for missing position
          result.push(createPlaceholderPhoto(`placeholder-${i}`, i));
        }
      }

      return result.sort((a, b) => (a.position || 0) - (b.position || 0));
    },
    [createPlaceholderPhoto]
  );

  const loadImagesWithDimensions = useCallback(async () => {
    if (!selectedMoodboard) {
      setItems([]);
      return;
    }

    setLoading(true);

    try {
      let loaded: UnifiedMoodboardItem[] = [];

      // Always process reference moodboard assets if they exist
      if (assets && assets.length > 0) {
        loaded = processAssetsToItems(assets, bulkGalleryItems);
      }

      // Always fill with placeholders to ensure proper grid layout
      loaded = fillWithPlaceholders(loaded, noOfImagesForMoodboard);

      setItems(loaded);
    } catch (error) {
      console.error("Failed to load reference images:", error);
      // Still create placeholders even if loading fails
      const placeholders = fillWithPlaceholders([], noOfImagesForMoodboard);
      setItems(placeholders);
    } finally {
      setLoading(false);
    }
  }, [
    selectedMoodboard,
    assets,
    bulkGalleryItems,
    noOfImagesForMoodboard,
    processAssetsToItems,
    fillWithPlaceholders,
  ]);

  // Create a ref for the loadImagesWithDimensions function to avoid dependency issues
  const loadImagesRef = useRef<(() => Promise<void>) | null>(null);

  // Update the ref whenever the function changes
  useEffect(() => {
    loadImagesRef.current = loadImagesWithDimensions;
  }, [loadImagesWithDimensions]);

  useEffect(() => {
    if (selectedMoodboard && loadImagesRef.current) {
      const timeoutId = setTimeout(() => {
        loadImagesRef.current?.();
      }, 50);
      return () => clearTimeout(timeoutId);
    } else {
      setItems([]);
    }
  }, [
    selectedMoodboard?.id,
    assetsKey,
    bulkGalleryItems.length,
    noOfImagesForMoodboard,
  ]);

  return {
    items,
    setItems,
    loading,
    isBulkLoading,
    isBulkFetching,
    selectedMoodboard,
    noOfImagesForMoodboard,
  };
};
