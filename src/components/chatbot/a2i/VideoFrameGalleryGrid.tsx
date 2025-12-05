import { Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { GalleryItemResponse } from "@/types/gallery.types";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoFrameGalleryGridProps {
  items: GalleryItemResponse[];
  isLoading: boolean;
  startFrameUrl?: string; // Changed from masterReferenceUrls
  endFrameUrl?: string; // Changed from productReferenceUrls
  onItemClick: (assetUrl: string, assetId: string, size?: string) => void;
  onDragStart: (e: React.DragEvent, assetUrl: string, assetId?: string) => void;
  onDeleteItem: (item: GalleryItemResponse) => void;
  isSingleMode?: boolean;
}

export const VideoFrameGalleryGrid = ({
  items,
  isLoading,
  startFrameUrl,
  endFrameUrl,
  onItemClick,
  onDragStart,
  onDeleteItem,
  isSingleMode = false,
}: VideoFrameGalleryGridProps) => {
  if (isLoading && items.length === 0) {
    return (
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton key={index} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground text-center">
          Recently used images will appear here
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn("grid gap-2", isSingleMode ? "grid-cols-8" : "grid-cols-6")}
    >
      {items.map((item) => {
        const isStartFrame = startFrameUrl === item.asset_url;
        const isEndFrame = endFrameUrl === item.asset_url;
        const isSelected = isStartFrame || isEndFrame;

        return (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => onDragStart(e, item.asset_url, item.id)}
            onClick={() => onItemClick(item.asset_url, item.id, item.size)}
            className={cn(
              "relative aspect-square rounded-lg group cursor-pointer border-2 transition-all overflow-hidden",
              isSelected
                ? "border-primary ring-2 ring-primary"
                : "border-transparent hover:border-primary"
            )}
          >
            <img
              src={item.asset_url}
              alt={item.asset_title || "Gallery item"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

            {isSelected && !isSingleMode && (
              <div className="absolute top-1 right-1 bg-primary text-white text-xs px-2 py-0.5 rounded">
                {isStartFrame ? "Start" : "End"}
              </div>
            )}

            {/* Delete button */}
            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item);
                }}
                className="p-1 bg-destructive text-white rounded-full hover:bg-destructive/80"
                aria-label="Remove from gallery"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
