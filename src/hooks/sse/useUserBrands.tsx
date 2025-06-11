import { getSSEBaseUrl } from "@/lib/utils";
import { fetchUserBrands } from "@/services/api/user.service";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { UserBrand } from "@/types/user.types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export const useUserBrands = (userId?: string) => {
  const {
    setBrands,
    addBrand,
    removeBrand,
    setIsBrandsFetched,
    setSelectedBrandId,
  } = useBrandStore();
  const { user } = useUserStore();
  const { data, error } = useQuery({
    queryKey: ["brands"],
    queryFn: () => fetchUserBrands(user!.id),
  });

  useEffect(() => {
    if (data) {
      setBrands(data);
      setIsBrandsFetched(true);
    }

    if (error) {
      console.error("Error fetching user brands:", error);
    }
  }, [data, error]);

  useEffect(() => {
    if (!userId) return;

    const eventSource = new EventSource(
      `${getSSEBaseUrl()}/users/${userId}/brands`
    );

    eventSource.addEventListener("brand_insert", (event) => {
      const brand = JSON.parse(event.data) as UserBrand;
      if (brand.created_by === userId) {
        setSelectedBrandId(brand.id);
      }
      addBrand(brand);
    });

    eventSource.addEventListener("brand_delete", (event) => {
      const brandId = JSON.parse(event.data).id;
      removeBrand(brandId);
    });

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [userId]);

  return null;
};
