import { getSSEBaseUrl } from "@/lib/utils";
import { useBrandStore } from "@/store/brand.store";
import { ThreadDetails, ThreadCampaign } from "@/types/types";
import { useEffect, useRef, useState } from "react";
import { useVideoGenStore } from "@/store/video-gen.store";
import { useQueryClient } from "@tanstack/react-query";

export function useBrandUpdates() {
  const queryClient = useQueryClient();
  const [isFetchingBrandInfo, setIsFetchingBrandInfo] = useState(false);
  const [data, setData] = useState<ThreadDetails | null>(null);
  const previousCampaignInfo = useRef<ThreadCampaign[] | undefined>(undefined);
  const { setGenerations } = useVideoGenStore();
  const { setIsCampaignCreating, selectedBrandId } = useBrandStore();

  useEffect(() => {
    setIsFetchingBrandInfo(true);

    if (!selectedBrandId) {
      setIsFetchingBrandInfo(false);
      return;
    }

    const eventSource = new EventSource(
      `${getSSEBaseUrl()}/brands/${selectedBrandId}`
    );

    eventSource.addEventListener("brand_info", (event) => {
      const parsed: ThreadDetails = JSON.parse(event.data);

      // Check for campaign_information change
      const newCampaign = JSON.stringify(parsed.campaign_information || []);
      const prevCampaign = JSON.stringify(previousCampaignInfo.current || []);

      if (newCampaign !== prevCampaign) {
        queryClient.invalidateQueries({ queryKey: ["brands"] });
        setIsCampaignCreating(false); // <-- mark creation as done
      }

      previousCampaignInfo.current = parsed.campaign_information;
      setIsFetchingBrandInfo(false);
      setData(parsed);

      if (
        parsed.a2i_image_information?.generations &&
        parsed.a2i_image_information.generations.length > 0
      ) {
        setGenerations(parsed.a2i_image_information.generations);
      }
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
  }, [selectedBrandId]);

  return {
    data,
    isFetchingBrandInfo,
  };
}
