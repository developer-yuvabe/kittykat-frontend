import { useMoodboardQuery } from "@/hooks/useMoodboardQuery";
import { galleryService } from "@/services/api/gallery.service";
import { useMoodboardStore } from "@/store/moodboard.store";
import { MoodboardInformation } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

// Custom hook for managing moodboard data
export const useMoodboardData = (
  moodboard: MoodboardInformation,
  brandId: string
) => {
  const { noOfImagesForMoodboard, setNoOfImagesForMoodboard } =
    useMoodboardStore();

  // Gallery item IDs for bulk fetch
  const galleryItemIds = useMemo(() => {
    return (
      moodboard?.moodboard_assets?.map((asset) => asset.gallery_item_id) || []
    );
  }, [moodboard?.moodboard_assets]);

  // Get only non-placeholder IDs for API call
  const nonPlaceholderIds = useMemo(() => {
    return galleryItemIds.filter((id) => !String(id).startsWith("placeholder"));
  }, [galleryItemIds]);

  // Bulk gallery items query
  const { data: bulkGalleryItems = [] } = useQuery({
    queryKey: ["gallery-items-bulk", nonPlaceholderIds],
    queryFn: () =>
      galleryService.getGalleryItemsBulk({ ids: nonPlaceholderIds }),
    enabled: nonPlaceholderIds.length > 0,
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });

  // TanStack Query for autofill suggestions
  const {
    data: autoFillSuggestions = [],
    isLoading: isAutoFillLoading,
    updateAutoFillSuggestionCache,
  } = useMoodboardQuery({
    brandId,
    campaignId: moodboard.campaign_id,
    moodboardId: moodboard.id,
    count: 50,
  });

  return {
    bulkGalleryItems,
    autoFillSuggestions,
    isAutoFillLoading,
    updateAutoFillSuggestionCache,
    noOfImagesForMoodboard,
    setNoOfImagesForMoodboard,
  };
};
