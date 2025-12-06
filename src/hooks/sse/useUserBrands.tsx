import { getSSEBaseUrl } from "@/lib/utils";
import { getTeamBrands } from "@/services/api/team.service";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { UserBrand } from "@/types/user.types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { updateCurrentContextBrandId } from "@/services/api/langgraph.service";

export const useUserBrands = () => {
  const {
    setBrands,
    addBrand,
    removeBrand,
    isBrandsFetched,
    brands,
    setIsBrandsFetched,
    setSelectedBrandId,
    setIsCreatingBrand,
    selectedBrandId,
  } = useBrandStore();
  const { user } = useUserStore();

  useEffect(() => {
    if (!isBrandsFetched || !user) return;
    const sortedBrands = [...brands].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    //  If there's already a selectedBrandId and it belongs to the current team,
    //    do nothing — no need to switch or update the context.
    if (selectedBrandId && brands.some((b) => b.id === selectedBrandId)) {
      return;
    }
    //  If there are brands after sorting, select the ID of the first brand
    //    in the sorted array and update the current context thread if available.
    if (sortedBrands.length > 0) {
      const firstId = sortedBrands[0].id;
      setSelectedBrandId(firstId);

      if (user?.thread_id) {
        updateCurrentContextBrandId(user.thread_id, firstId, null);
      }
    } else {
      // If there are no brands in this team, clear selected brand and update context
      setSelectedBrandId(null);
      if (user?.thread_id) {
        updateCurrentContextBrandId(user.thread_id, null, null);
      }
    }
  }, [isBrandsFetched, user?.active_team_id, selectedBrandId, user?.thread_id]);

  useQuery({
    queryKey: ["brands", user?.active_team_id],
    queryFn: async () => {
      const brands = await getTeamBrands(user!.active_team_id);

      if (brands) setBrands(brands);
      setIsBrandsFetched(true);

      return brands;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const eventSource = new EventSource(
      `${getSSEBaseUrl()}/users/${user.id}/brands`
    );

    eventSource.addEventListener("brand_insert", (event) => {
      const brand = JSON.parse(event.data) as UserBrand;
      if (brand.created_by.id === user.id) {
        setSelectedBrandId(brand.id);
      }
      addBrand(brand);

      // Set isCreatingBrand to false when a new brand is successfully created
      setIsCreatingBrand(false);
    });

    eventSource.addEventListener("brand_delete", (event) => {
      const brandId = JSON.parse(event.data).id;
      removeBrand(brandId);
    });

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  return null;
};
