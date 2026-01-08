import { QueueItem } from "@/types/types";
import React from "react";
import { Image, LoaderCircle, PackageIcon } from "lucide-react";
import { cn, formatToLocalTime } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import ProductExtractionProgress from "./ProductExtractionProgress";

const QueueItemView = ({ item }: { item: QueueItem }) => {
  const isProductExtraction = item.type === "product_extract";

  return (
    <div
      className={cn(
        "px-4 py-4 border-b flex items-center gap-4 bg-muted/10 border-l4",
        {
          "border-l-destructive bg-destructive/10": item.status === "failed",
          "border-l-primary bg-primary/10": item.status === "processing",
        }
      )}
    >
      <div className="flex shrink-0 overflow-hidden item-center justify-center">
        {item.status === "processing" ? (
          <LoaderCircle className="text-muted-foreground animate-spin" />
        ) : isProductExtraction ? (
          <PackageIcon className="text-muted-foreground" />
        ) : (
          <Image className="text-muted-foreground" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium leading-none">{item.title}</p>
        
        {isProductExtraction && <ProductExtractionProgress item={item} />}
        
        {item.metadata?.images && (
          <div className="flex gap-2 mt-2">
            {item.metadata.images.map((url: string) => (
              <div
                key={url}
                className="text-xs text-muted-foreground rounded-xs w-6 h-6 overflow-hidden"
              >
                <img src={url} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
        <p
          className={cn(
            "text-sm leading-none text-muted-foreground capitalize mt-1",
            {
              "text-red-500": item.status === "failed",
              "text-primary": item.status === "processing",
            }
          )}
        >
          {item.status}
        </p>
        <p className="text-xs text-muted-foreground w-max whitespace-nowrap">
          {formatDistanceToNow(formatToLocalTime(item.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
};

export default QueueItemView;
