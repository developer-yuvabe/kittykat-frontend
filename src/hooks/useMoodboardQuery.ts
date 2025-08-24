import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAutoFillMoodboardSuggestedImages } from "@/services/api/moodboard.service";
import { AutoFillSuggestedImage } from "@/types/moodboard.types";

interface UseMoodboardQueryOptions {
  brandId?: string;
  campaignId?: string;
  moodboardId?: string;
  count?: number;
  enabled?: boolean;
  staleTime?: number;
  retry?: number;
}

// Helper function to get the query key for cache manipulation
export function getMoodboardQueryKey(
  brandId?: string,
  campaignId?: string,
  moodboardId?: string,
  count: number = 50
) {
  return ["autofill-suggestions", brandId, campaignId, moodboardId, count];
}

export function useMoodboardQuery({
  brandId,
  campaignId,
  moodboardId,
  count = 50,
  enabled = true,
  staleTime = 1000 * 60 * 5, // 5 minutes
  retry = 2,
}: UseMoodboardQueryOptions) {
  const queryClient = useQueryClient();

  const query = useQuery<AutoFillSuggestedImage[]>({
    queryKey: getMoodboardQueryKey(brandId, campaignId, moodboardId, count),
    queryFn: () =>
      getAutoFillMoodboardSuggestedImages(
        brandId!,
        campaignId!,
        moodboardId!,
        count
      ),
    enabled: enabled && !!brandId && !!campaignId && !!moodboardId,
    staleTime,
    retry,
  });

  // Function to optimistically update autofill cache
  const updateAutoFillSuggestionCache = (
    imageId: string,
    newFavoriteState: boolean
  ) => {
    const queryKey = getMoodboardQueryKey(
      brandId,
      campaignId,
      moodboardId,
      count
    );

    queryClient.setQueryData<AutoFillSuggestedImage[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      return oldData.map((item) =>
        item.id === imageId ? { ...item, is_favourite: newFavoriteState } : item
      );
    });
  };

  function refetchAllAutoFillQueries() {
    queryClient.refetchQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        typeof query.queryKey[0] === "string" &&
        query.queryKey[0].startsWith("autofill-suggestions"),
    });
  }

  return {
    ...query,
    updateAutoFillSuggestionCache,
    refetchAllAutoFillQueries,
  };
}
