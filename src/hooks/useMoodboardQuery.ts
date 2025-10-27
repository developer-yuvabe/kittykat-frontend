import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getAutoFillMoodboardSuggestedImages } from "@/services/api/moodboard.service";
import { AutoFillSuggestedImage } from "@/types/moodboard.types";
import { addDeprioritizedIds } from "@/services/api/brand.service";

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
    // get all queries starting with "autofill-suggestions"
    const allQueries = queryClient.getQueriesData<AutoFillSuggestedImage[]>({
      queryKey: ["autofill-suggestions"],
      exact: false,
    });

    allQueries.forEach(([queryKey, oldData]) => {
      if (!oldData) return;

      queryClient.setQueryData<AutoFillSuggestedImage[]>(queryKey, () => {
        // Update the favorite state without reordering
        return oldData.map((item) =>
          item.id === imageId
            ? { ...item, is_favourite: newFavoriteState }
            : item
        );
      });
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

  // Mutation for deprioritizing/removing images
  const deprioritizeMutation = useMutation({
    mutationFn: async (imageIds: string[]) => {
      if (!brandId || !campaignId || !moodboardId) {
        throw new Error("Missing required IDs for deprioritization");
      }

      // Optimistically update cache by moving deprioritized images to the end
      const allQueries = queryClient.getQueriesData<AutoFillSuggestedImage[]>({
        queryKey: ["autofill-suggestions"],
        exact: false,
      });

      allQueries.forEach(([queryKey, oldData]) => {
        if (!oldData) return;

        queryClient.setQueryData<AutoFillSuggestedImage[]>(queryKey, () => {
          const deprioritizedSet = new Set(imageIds);
          const prioritized = oldData.filter(
            (item) => !deprioritizedSet.has(item.id)
          );
          const deprioritized = oldData.filter((item) =>
            deprioritizedSet.has(item.id)
          );

          return [...prioritized, ...deprioritized];
        });
      });

      return addDeprioritizedIds(brandId, campaignId, moodboardId, imageIds);
    },
    onSuccess: () => {
      refetchAllAutoFillQueries();
    },
  });

  return {
    ...query,
    updateAutoFillSuggestionCache,
    refetchAllAutoFillQueries,
    deprioritizeMutation,
  };
}
