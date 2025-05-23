import { QueueItem } from "@/types/types";
import React from "react";
import { Image, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const QueueItemView = ({ item }: { item: QueueItem }) => {
  return (
    <div className="px-4 py-6 border-b hover:bg-muted flex items-start gap-4 bg-muted/50">
      <div className="flex w-10 h-10 shrink-0 overflow-hidden rounded-full item-center justify-center">
        {item.status === "processing" ? (
          <LoaderCircle className="text-muted-foreground animate-spin my-auto" />
        ) : (
          <Image className="text-muted-foreground my-auto" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium leading-none">{item.title}</p>
        <p
          className={cn(
            "text-xs leading-none text-muted-foreground capitalize mt-1",
            {
              "text-red-500": item.status === "failed",
              "text-green-500": item.status === "completed",
            }
          )}
        >
          {item.status}
        </p>
      </div>
    </div>
  );
};

export default QueueItemView;
