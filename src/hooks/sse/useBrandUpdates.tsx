import { getSSEBaseUrl } from "@/lib/utils";
import { ThreadDetails } from "@/types/types";
import { useEffect, useState } from "react";

export function useBrandUpdates(brandId?: string | null) {
  const [isFetchingBrandInfo, setIsFetchingBrandInfo] = useState(false);
  const [data, setData] = useState<ThreadDetails | null>(null);

  useEffect(() => {
    if (!brandId) {
      setIsFetchingBrandInfo(false);
      return;
    }

    const eventSource = new EventSource(`${getSSEBaseUrl()}/brands/${brandId}`);

    eventSource.addEventListener("brand_info", (event) => {
      const parsed = JSON.parse(event.data);
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
    };
  }, [brandId]);

  return {
    data,
    isFetchingBrandInfo,
  };
}
