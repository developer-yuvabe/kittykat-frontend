import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GalleryItemResponse } from "@/types/gallery.types";
import { Heart } from "lucide-react";

interface MediaOverlayProps {
  item: GalleryItemResponse;
  isSelected: boolean;
  isHovered: boolean;
  isMediaSelectDialog?: boolean;
  isMultiSelectMode?: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onToggleFavorite: (id: string) => void;
  isAlreadySelected: boolean;
  isDisabled?: boolean;
  selectedCount?: number;
  maxSelectionCount?: number;
}

// Media Overlay Component
export function MediaOverlay({
  item,
  isSelected,
  isHovered,
  isMediaSelectDialog,
  isMultiSelectMode = false,
  onSelect,
  onToggleFavorite,
  isAlreadySelected,
  isDisabled = false,
  selectedCount,
  maxSelectionCount,
}: MediaOverlayProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(item.id);
  };

  const handleSelectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Don't allow selection if item is disabled (already selected elsewhere)
    if (isDisabled || isAlreadySelected) {
      return;
    }

    onSelect(item.id, !isSelected);
  };

  const shouldShowSelection = isHovered || isSelected || isAlreadySelected;

  const hasReachedMax =
    typeof selectedCount === "number" &&
    typeof maxSelectionCount === "number" &&
    selectedCount >= maxSelectionCount;
  const isCheckboxDisabled =
    isDisabled || isAlreadySelected || (hasReachedMax && !isSelected);

  return (
    <>
      {/* Gradient Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 transition-opacity duration-300 pointer-events-none
          ${isHovered ? "opacity-100" : "opacity-0"}`}
      >
        <div className="absolute left-0 right-0 top-0 h-8 bg-gradient-to-b from-black/60 to-transparent" />
      </div>

      {/* Selection Controls */}
      <div
        className={`absolute top-2 left-2 z-10 transition-opacity duration-200 ${
          shouldShowSelection ? "opacity-100" : "opacity-0"
        }`}
      >
        {isMediaSelectDialog ? (
          // Single Select Mode - Button
          <Button
            variant="secondary"
            size="xs"
            disabled={isCheckboxDisabled}
            className={`transition-all duration-200 ${
              isCheckboxDisabled
                ? "opacity-50 cursor-not-allowed bg-gray-400"
                : "hover:bg-white hover:text-black"
            }`}
            onClick={handleSelectionClick}
          >
            {isAlreadySelected ? "Selected" : "Select"}
          </Button>
        ) : isMultiSelectMode ? (
          // Multi Select Mode - Checkbox
          <div className="flex items-center space-x-1">
            <Checkbox
              checked={isSelected || isAlreadySelected}
              disabled={isCheckboxDisabled}
              onCheckedChange={(checked) => {
                if (!isCheckboxDisabled) {
                  onSelect(item.id, checked as boolean);
                }
              }}
              className={`h-5 w-5 border-2 transition-all duration-200 ${
                isCheckboxDisabled
                  ? "border-gray-400 bg-gray-300 opacity-50 cursor-not-allowed data-[state=checked]:bg-gray-400 data-[state=checked]:border-gray-400"
                  : "border-white bg-black/30 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black hover:border-gray-200"
              }`}
            />
            {isAlreadySelected && (
              <span className="text-xs text-white/80 bg-black/50 px-1 rounded">
                Added
              </span>
            )}
          </div>
        ) : (
          // Regular Gallery Mode - Checkbox (existing behavior)
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(item.id, checked as boolean)}
            className="h-5 w-5 border-2 border-white bg-black/30 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black transition-all duration-200 hover:border-gray-200"
          />
        )}
      </div>

      {/* Disabled Overlay for Already Selected Items */}
      {isAlreadySelected && (
        <div className="absolute inset-0 bg-black/20 z-5 pointer-events-none">
          <div className="absolute inset-0 border-2 border-purple-600 " />
        </div>
      )}

      {/* Favorite Button */}
      <div
        className={`absolute bottom-2 left-2 z-10 transition-opacity duration-200 cursor-pointer ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleFavoriteClick}
      >
        <Heart
          className={`h-4 w-4 transition-all duration-300 hover:scale-110 ${
            item.is_favourite
              ? "fill-red-500 text-red-500"
              : "text-white hover:text-red-300"
          }`}
        />
      </div>

      {/* Bottom Gradient */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 pointer-events-none
          ${isHovered ? "opacity-100" : "opacity-0"}`}
      >
        <div className="absolute left-0 right-0 bottom-0 h-8 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
    </>
  );
}
