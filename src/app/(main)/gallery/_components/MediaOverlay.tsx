import { Checkbox } from "@/components/ui/checkbox";
import { GalleryItemResponse } from "@/types/gallery.types";
import { HeartIcon, DownloadIcon } from "lucide-react";

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
  onDownload: (item: GalleryItemResponse, e: React.MouseEvent) => void;
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
  onDownload,
}: MediaOverlayProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(item.id);
  };

  const shouldShowSelection = isHovered || isSelected || isAlreadySelected;

  const hasReachedMax =
    typeof selectedCount === "number" &&
    typeof maxSelectionCount === "number" &&
    selectedCount >= maxSelectionCount;
  const isCheckboxDisabled = isDisabled || isAlreadySelected || hasReachedMax;

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
        {isMediaSelectDialog || isMultiSelectMode ? (
          // Checkbox for both Single and Multi Select Mode
          <div className="flex items-center space-x-1">
            <Checkbox
              checked={isSelected || isAlreadySelected}
              disabled={isCheckboxDisabled}
              onCheckedChange={(checked) => {
                if (!isCheckboxDisabled) {
                  onSelect(item.id, checked as boolean);
                }
              }}
            />
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
        className={`absolute bottom-2 right-2 z-10 transition-opacity duration-200 cursor-pointer ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleFavoriteClick}
      >
        <HeartIcon
          className={`h-5 w-5 transition-all duration-300 hover:scale-110 ${
            item.is_favourite
              ? "fill-red-500 text-red-500"
              : "text-white hover:text-red-300"
          }`}
        />
      </div>

      {/* Download Button */}
      <div
        className={`absolute bottom-2 left-2 z-10 transition-opacity duration-200 cursor-pointer ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
        onClick={(e) => onDownload(item, e)}
      >
        <DownloadIcon className="h-5 w-5 text-white hover:text-gray-300 transition-all duration-300 hover:scale-110" />
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
