import { getSSEBaseUrl } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export interface ProductBatchStatus {
  status: "pending" | "processing" | "completed" | "failed";
  total_images: number;
  processed_images: number;
}

interface UseProductBatchProgressProps {
  batchId: string | null;
  onComplete?: (status: ProductBatchStatus) => void;
  onError?: () => void;
}

export function useProductBatchProgress({
  batchId,
  onComplete,
  onError,
}: UseProductBatchProgressProps) {
  const [batchStatus, setBatchStatus] = useState<ProductBatchStatus | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!batchId) {
      setBatchStatus(null);
      setIsConnected(false);
      return;
    }

    const eventSource = new EventSource(
      `${getSSEBaseUrl()}/product-batch/${batchId}`
    );
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("batch_status", (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (!data || Object.keys(data).length === 0) {
          // Empty data means batch not found or error
          setBatchStatus(null);
          setIsConnected(false);
          onError?.();
          return;
        }

        const status: ProductBatchStatus = {
          status: data.status || "pending",
          total_images: data.total_images || 0,
          processed_images: data.processed_images || 0,
        };

        setBatchStatus(status);
        setIsConnected(true);

        // Check if completed or failed
        if (status.status === "completed" || status.status === "failed") {
          onComplete?.(status);
          // Close connection after completion
          setTimeout(() => {
            eventSource.close();
          }, 1000);
        }
      } catch (error) {
        console.error("Error parsing batch status:", error);
        onError?.();
      }
    });

    eventSource.onerror = () => {
      console.error("SSE connection error for batch:", batchId);
      setIsConnected(false);
      onError?.();
    };

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [batchId, onComplete, onError]);

  return {
    batchStatus,
    isConnected,
    closeConnection: () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    },
  };
}
