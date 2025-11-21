import { getSSEBaseUrl } from "@/lib/utils";
import { useBrandStore } from "@/store/brand.store";
import { ThreadDetails } from "@/types/types";
import { useEffect, useRef } from "react";
import { useVideoGenStore } from "@/store/video-gen.store";
import { useQueryClient } from "@tanstack/react-query";
import { useBrandUpdatesStore } from "@/store/brand-updates.store";

export function useBrandUpdates() {
  const queryClient = useQueryClient();
  const previousCampaignCount = useRef<number>(0);
  const previousGenerationStatus = useRef<Record<string, string>>({});
  const { setGenerations } = useVideoGenStore();
  const { setIsCampaignCreating, selectedBrandId, setSelectedCampaignId } =
    useBrandStore();
  const { setIsFetchingBrandInfo, setData } = useBrandUpdatesStore();

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

      // Check for new campaign by comparing count
      const currentCount = parsed.campaign_information?.length || 0;
      const hasNewCampaign = currentCount > previousCampaignCount.current;

      if (hasNewCampaign) {
        queryClient.invalidateQueries({ queryKey: ["brands"] });
        setIsCampaignCreating(false); // <-- mark creation as done

        const latestCreatedCampaign = parsed.campaign_information?.at(-1);

        // Allow auto-select only on the main dashboard page for realtime updates
        if (latestCreatedCampaign && window.location.pathname === "/") {
          setSelectedCampaignId(latestCreatedCampaign.id);
        }
      }

      previousCampaignCount.current = currentCount;
      setIsFetchingBrandInfo(false);
      setData(parsed);

      if (
        parsed.a2i_image_information?.generations &&
        parsed.a2i_image_information.generations.length > 0
      ) {
        setGenerations(parsed.a2i_image_information.generations);

        // Check if any generation just completed
        const hasNewlyCompletedGenerations =
          parsed.a2i_image_information.generations.some((gen) => {
            const previousStatus = previousGenerationStatus.current[gen.id];
            const isNewlyCompleted =
              previousStatus !== "completed" && gen.status === "completed";

            // Update the stored status
            previousGenerationStatus.current[gen.id] = gen.status;

            return isNewlyCompleted;
          });

        if (hasNewlyCompletedGenerations) {
          queryClient.invalidateQueries({
            queryKey: ["gallery-items"],
            exact: false,
            refetchType: "all",
          });
        }
      }
    });

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
    };

    return () => {
      eventSource.close();
      setIsFetchingBrandInfo(true);
      setData(null);
      previousCampaignCount.current = 0;
    };
  }, [selectedBrandId]);
}
