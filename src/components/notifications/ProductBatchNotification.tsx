import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductBatchStatus } from "@/hooks/sse/useProductBatchProgress";

interface ProductBatchNotificationProps {
  batchStatus: ProductBatchStatus;
  brandName?: string;
  onDismiss?: () => void;
}

export function ProductBatchNotification({
  batchStatus,
  brandName,
  onDismiss,
}: ProductBatchNotificationProps) {
  const percentage =
    batchStatus.total_images > 0
      ? Math.round(
          (batchStatus.processed_images / batchStatus.total_images) * 100
        )
      : 0;

  const getStatusIcon = () => {
    switch (batchStatus.status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (batchStatus.status) {
      case "completed":
        return "Product extraction completed";
      case "failed":
        return "Product extraction failed";
      case "processing":
        return "Extracting products...";
      default:
        return "Product extraction pending";
    }
  };

  const getStatusColor = () => {
    switch (batchStatus.status) {
      case "completed":
        return "bg-green-100 border-green-200";
      case "failed":
        return "bg-red-100 border-red-200";
      case "processing":
        return "bg-blue-100 border-blue-200";
      default:
        return "bg-gray-100 border-gray-200";
    }
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-4 space-y-3 transition-all",
        getStatusColor()
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium">{getStatusText()}</p>
              {brandName && (
                <Badge variant="secondary" className="text-xs">
                  {brandName}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-600">
              {batchStatus.processed_images} of {batchStatus.total_images}{" "}
              images processed
            </p>
          </div>
        </div>
        {batchStatus.status !== "processing" && onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>

      {batchStatus.status === "processing" && (
        <div className="space-y-1">
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-gray-500 text-right">{percentage}%</p>
        </div>
      )}

      {batchStatus.status === "completed" && (
        <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
          ✓ Products have been extracted and added to your gallery
        </div>
      )}

      {batchStatus.status === "failed" && (
        <div className="text-xs text-red-700 bg-red-50 p-2 rounded">
          ✗ Failed to extract products. Please try again.
        </div>
      )}
    </div>
  );
}
