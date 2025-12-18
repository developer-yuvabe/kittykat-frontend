import { getSSEBaseUrl } from "@/lib/utils";
import { useBrandStore } from "@/store/brand.store";
import { useEffect } from "react";

export function useCampaignAnalyzingStatus() {
  const { selectedBrandId, brands, setBrands } = useBrandStore();

  useEffect(() => {
    if (!selectedBrandId) return;

    const eventSource = new EventSource(
      `${getSSEBaseUrl()}/brands/${selectedBrandId}/campaigns/analyzing-status`
    );

    eventSource.addEventListener("campaign_analyzing_status", (event) => {
      const parsed = JSON.parse(event.data);
      const { brand_id, campaigns } = parsed;

      if (brand_id !== selectedBrandId) return;

      // Update the brands store with the new analyzing status
      const updatedBrands = brands.map((brand) => {
        if (brand.id !== brand_id) return brand;

        return {
          ...brand,
          campaigns: brand.campaigns.map((campaign) => {
            const statusUpdate = campaigns.find(
              (c: any) => c.id === campaign.id
            );
            if (!statusUpdate) return campaign;

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
