import { getSSEBaseUrl } from "@/lib/utils";
import { useBrandStore } from "@/store/brand.store";
import { UserBrand } from "@/types/user.types";
import { useEffect } from "react";

export const useUserBrands = (userId?: string) => {
  const {
    setBrands,
    addBrand,
    removeBrand,
    setIsBrandsFetched,
    setSelectedBrandId,
  } = useBrandStore();

  useEffect(() => {
    if (!userId) return;

    const eventSource = new EventSource(
      `${getSSEBaseUrl()}/users/${userId}/brands`
    );

    eventSource.addEventListener("brands", (event) => {
      const data = JSON.parse(event.data);
      setBrands(data);
      setIsBrandsFetched(true);
    });

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
