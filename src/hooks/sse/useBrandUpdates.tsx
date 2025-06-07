import { getSSEBaseUrl } from "@/lib/utils";
import { ThreadDetails } from "@/types/types";
import { useEffect, useState } from "react";

export function useBrandUpdates(brandId?: string | null) {
  const [isFectchingThreadInfo, setIsFectchingThreadInfo] = useState(false);
  const [data, setData] = useState<ThreadDetails | null>(null);

  useEffect(() => {
    if (!brandId) {
      setIsFectchingThreadInfo(false);
      return;
    }

    const eventSource = new EventSource(`${getSSEBaseUrl()}/brands/${brandId}`);

    eventSource.addEventListener("brand_info", (event) => {
      const parsed = JSON.parse(event.data);
      setIsFectchingThreadInfo(false);
      setData(parsed);
    });

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
    };

    return () => {
      eventSource.close();
      setIsFectchingThreadInfo(true);
      setData(null);
    };
  }, [brandId]);

  return {
    data,
    isFectchingThreadInfo,
  };
}
