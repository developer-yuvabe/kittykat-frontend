import { getSSEBaseUrl } from "@/lib/utils";
import { QueueItem } from "@/types/types";
import { useEffect, useState } from "react";

export function useQueueUpdates(userId?: string) {
  const [isFectchingQueueInfo, setIsFectchingQueueInfo] = useState(false);
  const [data, setData] = useState<QueueItem[]>([]);

  useEffect(() => {
    if (!userId) {
      setIsFectchingQueueInfo(false);
      return;
    }

    const eventSource = new EventSource(`${getSSEBaseUrl()}/queue/${userId}`);

    eventSource.addEventListener("queue_info", (event) => {
      const parsed = JSON.parse(event.data);
      setIsFectchingQueueInfo(false);
      setData(parsed || []);
    });

    eventSource.onerror = (err) => {
      console.log("SSE error:", JSON.stringify(err, null, 2));
    };

    return () => {
      eventSource.close();
      setIsFectchingQueueInfo(true);
      setData([]);
    };
  }, [userId]);

  return {
    data,
    isFectchingQueueInfo,
  };
}
