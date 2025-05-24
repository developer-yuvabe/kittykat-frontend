import { QueueItem } from "@/types/types";
import React from "react";
import { Image, LoaderCircle } from "lucide-react";
import { cn, formatToLocalTime } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const QueueItemView = ({ item }: { item: QueueItem }) => {
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
        ) : (
          <Image className="text-muted-foreground" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium leading-none">{item.title}</p>
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
