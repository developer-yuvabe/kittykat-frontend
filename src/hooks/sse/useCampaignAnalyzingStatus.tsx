import { getSSEBaseUrl } from "@/lib/utils";
import { useBrandStore } from "@/store/brand.store";
import { useEffect } from "react";

interface CampaignStatusUpdate {
  id: string;
  title: string;
  is_analyzing: boolean;
}

interface SSECampaignStatusEvent {
  brand_id: string;
  brand_is_analyzing: boolean;
  campaigns: CampaignStatusUpdate[];
}

export function useCampaignAnalyzingStatus() {
  const selectedBrandId = useBrandStore((state) => state.selectedBrandId);

  useEffect(() => {
    if (!selectedBrandId) return;

    const eventSource = new EventSource(
      `${getSSEBaseUrl()}/brands/${selectedBrandId}/campaigns/analyzing-status`
    );

    eventSource.addEventListener("campaign_analyzing_status", (event) => {
      const parsed: SSECampaignStatusEvent = JSON.parse(event.data);
      const { brand_id, campaigns: campaignUpdates } = parsed;

      if (brand_id !== selectedBrandId) return;

      // Get fresh state to avoid stale closure issues
      const { brands, setBrands } = useBrandStore.getState();

      const updatedBrands = brands.map((brand) => {
        if (brand.id !== brand_id) return brand;

        return {
          ...brand,
          campaigns: brand.campaigns.map((campaign) => {
            const statusUpdate = campaignUpdates.find(
              (c) => c.id === campaign.id
            );
            if (!statusUpdate) return campaign;

            // Only update is_analyzing from SSE
            return {
              ...campaign,
              is_analyzing: statusUpdate.is_analyzing,
            };
          }),
        };
      });

      setBrands(updatedBrands);
    });

    eventSource.addEventListener("error", (event) => {
      const data = JSON.parse((event as MessageEvent).data);
      console.error(
        `SSE error for campaign analyzing status (brand ${data.brand_id}):`,
        data.error
      );
    });

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
    };

    return () => {
      eventSource.close();
    };
  }, [selectedBrandId]);
}

