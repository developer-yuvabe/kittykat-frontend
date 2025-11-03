import { Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { GalleryItemResponse } from "@/types/gallery.types";
import { Skeleton } from "@/components/ui/skeleton";

interface ReferenceGalleryGridProps {
  items: GalleryItemResponse[];
  isLoading: boolean;
  masterReferenceUrls: string[];
  productReferenceUrls: string[];
  onItemClick: (assetUrl: string, assetId: string, size?: string) => void;
  onDragStart: (e: React.DragEvent, assetUrl: string, assetId?: string) => void;
  onDeleteItem: (item: GalleryItemResponse) => void;
}

export const ReferenceGalleryGrid = ({
  items,
  isLoading,
  masterReferenceUrls,
  productReferenceUrls,
  onItemClick,
  onDragStart,
  onDeleteItem,
}: ReferenceGalleryGridProps) => {
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
    <div className="grid grid-cols-5 gap-2">
      {items.map((item) => {
        const isMaster = masterReferenceUrls.includes(item.asset_url);
        const isProduct = productReferenceUrls.includes(item.asset_url);
        const isSelected = isMaster || isProduct;

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
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

            {isSelected && (
              <div className="absolute top-1 right-1 bg-primary text-white text-xs px-2 py-0.5 rounded">
                {isMaster ? "Master" : "Product"}
              </div>
            )}

            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item);
                }}
                className="p-1 bg-destructive text-white rounded-full hover:bg-destructive/80"
              >
                <Trash className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
