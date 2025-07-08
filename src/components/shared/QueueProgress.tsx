import { useQueueUpdates } from "@/hooks/sse/useQueueUpdates";
import { useUserStore } from "@/store/user.store";
import { CircleDashed, ListEnd } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import QueueItemView from "./QueueItemView";
import { useEnhancedFilters } from "@/hooks/useEnhancedFilters";
import { useGalleryQuery } from "@/hooks/useGallery";

const QueueProgress = () => {
  const { user } = useUserStore();
  const { data } = useQueueUpdates(user?.id);
  const [open, setOpen] = React.useState(false);
  const { runningQueueItems, otherQueueItems } = useMemo(() => {
    const running = [];
    const others = [];

    if (data && Array.isArray(data)) {
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

  useEffect(() => {
    setOpen(runningQueueItems.length > 0);
  }, [runningQueueItems.length]);

  const {
    preselectedFilters,
    source,
    creator,
    activeTab,
    searchQuery,
    favorites,
  } = useEnhancedFilters({});

  const { refetchAllGalleryQueries } = useGalleryQuery({
    selectedFilters: preselectedFilters,
    source: source,
    creator: creator,
    assetType: activeTab,
    favorites: favorites,
    searchQuery: searchQuery,
  });

  useEffect(() => {
    refetchAllGalleryQueries();
  }, [runningQueueItems.length]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-medium text-base">
            {!!runningQueueItems.length ? (
              <p>{runningQueueItems.length}</p>
            ) : (
              <ListEnd className="text-muted-foreground" size={16} />
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-100 p-0 h-max max-h-80 overflow-y-auto"
        align="end"
      >
        {runningQueueItems.length + otherQueueItems.length > 0 ? (
          <div>
            <div className="px-4 py-2 border-b sticky top-0 bg-background z-10">
              <p className="text-xl font-semibold text-start">Queue</p>
            </div>
            {runningQueueItems.map((item) => (
              <QueueItemView key={item.id} item={item} />
            ))}
            {otherQueueItems.map((item) => (
              <QueueItemView key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="py-4">
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
