import { Trash } from "lucide-react";
import { GalleryItemResponse } from "@/types/gallery.types";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoFrameGalleryGridProps {
  items: GalleryItemResponse[];
  isLoading: boolean;
  onItemClick: (assetUrl: string, assetId: string, assetType: string) => void;
  onDragStart: (
    e: React.DragEvent,
    assetUrl: string,
    assetType: string,
    assetId?: string
  ) => void;
  onDeleteItem: (item: GalleryItemResponse) => void;
}

export const VideoFrameGalleryGrid = ({
  items,
  isLoading,
  onItemClick,
  onDragStart,
  onDeleteItem,
}: VideoFrameGalleryGridProps) => {
  if (isLoading && items.length === 0) {
    return (
      <div className="grid grid-cols-6 gap-2">
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
    <div className="grid grid-cols-6 gap-2">
      {items.map((item) => {
        const type = item.asset_type;
        return (
          <div
            key={item.id}
            draggable
            onDragStart={(e) =>
              onDragStart(e, item.asset_url, item.asset_type, item.id)
            }
            onClick={() =>
              onItemClick(item.asset_url, item.id, item.asset_type)
            }
            className="relative aspect-square rounded-lg group cursor-pointer border-2 transition-all overflow-hidden border-transparent hover:border-primary"
          >
            {type === "image" ? (
              <img
                src={item.asset_url}
                alt={item.asset_title || "Gallery item"}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={item.asset_url}
                className="w-full h-full object-cover"
                muted
                loop
                autoPlay
              />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

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
