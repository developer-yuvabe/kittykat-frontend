import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GalleryItemResponse } from "@/types/gallery.types";
import { Heart } from "lucide-react";

interface MediaOverlayProps {
  item: GalleryItemResponse;
  isSelected: boolean;
  isHovered: boolean;
  isMediaSelectDialog: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onToggleFavorite: (id: string) => void;
}

// Media Overlay Component
export function MediaOverlay({
  item,
  isSelected,
  isHovered,
  isMediaSelectDialog,
  onSelect,
  onToggleFavorite,
}: MediaOverlayProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(item.id);
  };

  return (
    <>
      {/* Gradient Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 transition-opacity duration-300 pointer-events-none
          ${isHovered ? "opacity-100" : "opacity-0"}`}
      >
        <div className="absolute left-0 right-0 top-0 h-8 bg-gradient-to-b from-black/60 to-transparent" />
      </div>

      {/* Selection Checkbox / Select Button */}
      {isMediaSelectDialog ? (
        <Button
          variant="secondary"
          size="xs"
          className={`absolute top-2 left-2 z-10 transition-opacity duration-200 ${
            isHovered || isSelected ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => onSelect(item.id, !isSelected)}
        >
          Select
        </Button>
      ) : (
        <div
          className={`absolute top-2 left-2 z-10 transition-opacity duration-200 ${
            isHovered || isSelected ? "opacity-100" : "opacity-0"
          }`}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(item.id, checked as boolean)}
            className="h-5 w-5 border-2 border-white bg-black/30 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black transition-all duration-200"
          />
        </div>
      )}

      {/* Favorite Button */}
      <div
        className={`absolute bottom-2 left-2 z-10 transition-opacity duration-200 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleFavoriteClick}
      >
        <Heart
          className={`h-4 w-4 transition-all duration-300 ${
            item.is_favourite ? "fill-red-500 text-red-500" : "text-white"
          }`}
        />
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 pointer-events-none
          ${isHovered ? "opacity-100" : "opacity-0"}`}
      >
        <div className="absolute left-0 right-0 bottom-0 h-8 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
    </>
  );
}
