import { QueueItem } from "@/types/types";
import React from "react";

interface ProductExtractionProgressProps {
  item: QueueItem;
}

const ProductExtractionProgress = ({ item }: ProductExtractionProgressProps) => {
  const totalImages = item.metadata?.total_images;
  const processedImages = item.metadata?.processed_images || 0;
  const totalProductsExtracted = item.metadata?.total_products_extracted;
  
  const progressPercentage = totalImages && totalImages > 0
    ? Math.round((processedImages / totalImages) * 100)
    : 0;

  return (
    <>
      {/* Show progress for product extraction */}
      {totalImages && item.status === "processing" && (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted-foreground">
            Processing {processedImages} of {totalImages} images ({progressPercentage}%)
          </p>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Show completion message with product count */}
      {item.status === "completed" && totalProductsExtracted && (
        <p className="text-xs text-green-600 mt-1">
          ✓ Extracted {totalProductsExtracted} product{totalProductsExtracted !== 1 ? 's' : ''}
        </p>
      )}
    </>
  );
};

export default ProductExtractionProgress;
