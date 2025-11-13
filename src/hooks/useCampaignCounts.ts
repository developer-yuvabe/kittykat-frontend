import { useQuery } from "@tanstack/react-query";
import { galleryService } from "@/services/api/gallery.service";
import { AssetCountResponse } from "@/types/gallery.types";

export function useCampaignCounts(brandId: string | null) {
  return useQuery<AssetCountResponse>({
    queryKey: ["campaign-counts", brandId],
    queryFn: () =>
      galleryService.getAssetCount({
        brand_id: brandId!,
        count_by_campaign: true,
      }),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
