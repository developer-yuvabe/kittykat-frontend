"use client";

import React from "react";
import { useProductBatchStore } from "@/store/product-batch.store";
import { useProductBatchProgress } from "@/hooks/sse/useProductBatchProgress";
import { ProductBatchNotification } from "./ProductBatchNotification";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function ProductBatchItem({
  batchId,
  brandName,
  onRemove,
}: {
  batchId: string;
  brandName: string;
  onRemove: (batchId: string) => void;
}) {
  const queryClient = useQueryClient();

  const { batchStatus } = useProductBatchProgress({
    batchId,
    onComplete: (status) => {
      if (status.status === "completed") {
        // Refetch gallery to show new products
        queryClient.invalidateQueries({ queryKey: ["gallery-items"] });
        toast.success(
          `Product extraction completed! ${status.processed_images} images processed.`
        );
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          onRemove(batchId);
        }, 5000);
      } else if (status.status === "failed") {
        toast.error("Product extraction failed. Please try again.");
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          onRemove(batchId);
        }, 5000);
      }
    },
    onError: () => {
      console.error("Error connecting to batch status stream");
      // Remove batch on error
      setTimeout(() => {
        onRemove(batchId);
      }, 3000);
    },
  });

  if (!batchStatus) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <ProductBatchNotification
        batchStatus={batchStatus}
        brandName={brandName}
        onDismiss={() => onRemove(batchId)}
      />
    </motion.div>
  );
}

export function ProductBatchNotificationList() {
  const { activeBatches, removeBatch } = useProductBatchStore();

  if (activeBatches.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] space-y-3">
      <AnimatePresence mode="popLayout">
        {activeBatches.map((batch) => (
          <ProductBatchItem
            key={batch.batchId}
            batchId={batch.batchId}
            brandName={batch.brandName}
            onRemove={removeBatch}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
