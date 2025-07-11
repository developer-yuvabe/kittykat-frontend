import { getSSEBaseUrl } from "@/lib/utils";
import { useBrandStore } from "@/store/brand.store";
import { ThreadDetails, ThreadCampaign } from "@/types/types";
import { useEffect, useRef, useState } from "react";

export function useBrandUpdates(brandId?: string | null) {
  const [isFetchingBrandInfo, setIsFetchingBrandInfo] = useState(false);
  const [data, setData] = useState<ThreadDetails | null>(null);
  const previousCampaignInfo = useRef<ThreadCampaign[] | undefined>(undefined);

  const { setIsCampaignCreating } = useBrandStore();

  useEffect(() => {
    if (!brandId) {
      setIsFetchingBrandInfo(false);
      return;
    }

    const eventSource = new EventSource(`${getSSEBaseUrl()}/brands/${brandId}`);

    eventSource.addEventListener("brand_info", (event) => {
      const parsed: ThreadDetails = JSON.parse(event.data);

      // Check for campaign_information change
      const newCampaign = JSON.stringify(parsed.campaign_information || []);
      const prevCampaign = JSON.stringify(previousCampaignInfo.current || []);

      if (newCampaign !== prevCampaign) {
        setIsCampaignCreating(false); // <-- mark creation as done
      }

      previousCampaignInfo.current = parsed.campaign_information;
      setIsFetchingBrandInfo(false);
      setData(parsed);
    });

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
    };

    return () => {
      eventSource.close();
      setIsFetchingBrandInfo(true);
      setData(null);
      previousCampaignInfo.current = undefined;
    };
  }, [brandId]);

  return {
    data,
    isFetchingBrandInfo,
  };
}
