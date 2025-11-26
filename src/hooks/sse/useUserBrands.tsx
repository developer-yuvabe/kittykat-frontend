import { getSSEBaseUrl } from "@/lib/utils";
import { fetchUserBrands } from "@/services/api/user.service";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { UserBrand } from "@/types/user.types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export const useUserBrands = () => {
  const {
    setBrands,
    addBrand,
    removeBrand,
    setIsBrandsFetched,
    setSelectedBrandId,
    setIsCreatingBrand,
  } = useBrandStore();
  const { user } = useUserStore();
  useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const brands = await fetchUserBrands(user!.id);

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
