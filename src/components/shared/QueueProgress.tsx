import { useQueueUpdates } from "@/hooks/useQueueUpdates";
import { useUserStore } from "@/store/user.store";
import { CircleDashed } from "lucide-react";
import React, { useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import QueueItemView from "./QueueItemView";

const QueueProgress = () => {
  const { user } = useUserStore();
  const { data } = useQueueUpdates(user?.id);

  console.log(data);

  const { runningQueueItems, otherQueueItems } = useMemo(() => {
    const running = [];
    const others = [];

    if (data) {
      for (const item of data) {
        if (item.status === "processing") {
          running.push(item);
        } else {
          others.push(item);
        }
      }
    }

    return { runningQueueItems: running, otherQueueItems: others };
  }, [data]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl font-medium relative"
          )}
        >
          <CircleDashed
            className={cn("text-muted-foreground stroke-1 w-full h-full", {
              "animate-spin": runningQueueItems?.length > 0,
            })}
          />
          {!!runningQueueItems.length && (
            <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-medium text-base">
              {runningQueueItems.length}
            </p>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-100 p-0 h-80 overflow-y-auto" align="end">
        {runningQueueItems.length + otherQueueItems.length > 0 ? (
          <>
            {runningQueueItems.map((item) => (
              <QueueItemView key={item.id} item={item} />
            ))}
            {otherQueueItems.map((item) => (
              <QueueItemView key={item.id} item={item} />
            ))}
          </>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground text-center italic">
              No items in queue.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default QueueProgress;
