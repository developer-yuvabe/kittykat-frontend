import { getSSEBaseUrl } from "@/lib/utils";
import { useBrandStore } from "@/store/brand.store";
import { ThreadDetails } from "@/types/types";
import { useEffect, useRef } from "react";
import { useGenerationsStore } from "@/store/generations.store";
import { useQueryClient } from "@tanstack/react-query";
import { useBrandUpdatesStore } from "@/store/brand-updates.store";
import { useUserStore } from "@/store/user.store";

export function useBrandUpdates() {
  const queryClient = useQueryClient();
  const previousCampaignCount = useRef<number>(0);
  const previousCompletedCount = useRef<number>(0); // Track completed generations count
  const { setGenerations } = useGenerationsStore();
  const { setIsCampaignCreating, selectedBrandId, setSelectedCampaignId } =
    useBrandStore();
  const { setIsFetchingBrandInfo, setData } = useBrandUpdatesStore();
  const { user } = useUserStore();

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

        // Only auto-select campaign if:
        // 1. On the main dashboard page
        // 2. Campaign was created by the currently logged-in user
        if (
          latestCreatedCampaign &&
          window.location.pathname === "/" &&
          user &&
          latestCreatedCampaign.created_by === user.id
        ) {
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

        // Count how many generations are completed
        const currentCompletedCount =
          parsed.a2i_image_information.generations.filter(
            (gen) => gen.status === "completed"
          ).length;

        // Only invalidate if completed count increased
        const hasNewCompletions =
          currentCompletedCount > previousCompletedCount.current;

        if (hasNewCompletions) {
          queryClient.invalidateQueries({
            queryKey: ["gallery-items"],
            exact: false,
            refetchType: "all",
          });
        }

        previousCompletedCount.current = currentCompletedCount;
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
      previousCompletedCount.current = 0;
    };
  }, [selectedBrandId]);
}
