import { Checkbox } from "@/components/ui/checkbox";
import { useMoodboardQuery } from "@/hooks/useMoodboardQuery";
import { GalleryItemResponse } from "@/types/gallery.types";
import {
  HeartIcon,
  DownloadIcon,
  PencilIcon,
  X,
  LayoutGridIcon,
  Expand,
  MessageCircle,
} from "lucide-react";
import { TooltipButton } from "@/components/ui/tooltip-button";

interface MediaOverlayProps {
  item: GalleryItemResponse;
  isSelected: boolean;
  isHovered: boolean;
  isMediaSelectDialog?: boolean;
  isMultiSelectMode?: boolean;
  onSelect: (id: string, selected: boolean) => void;
  isAlreadySelected: boolean;
  isDisabled?: boolean;
  selectedCount?: number;
  maxSelectionCount?: number;
  onDownload: (item: GalleryItemResponse, e: React.MouseEvent) => void;
  onToggleFavorite: () => void;
  onEditClick?: (item: GalleryItemResponse) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  onEditMoodboard?: (item: GalleryItemResponse) => void;
  onExpandClick?: (e: React.MouseEvent) => void;
}

// 🔑 Control size for all overlay buttons & checkbox
const OVERLAY_CONTROL_SIZE = 5;

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
  onEditClick,
  onDelete,
  onEditMoodboard,
  onExpandClick,
}: MediaOverlayProps) {
  const { updateAutoFillSuggestionCache } = useMoodboardQuery({});

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIsFavourite = !item.is_favourite;
    onToggleFavorite();
    updateAutoFillSuggestionCache(item.id, newIsFavourite);
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
        onClick={(e) => e.stopPropagation()} // Prevent tile click when clicking checkbox
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
              className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
            />
          </div>
        ) : (
          // Regular Gallery Mode - Checkbox (existing behavior)
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(item.id, checked as boolean)}
            className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE} border-2 border-white bg-black/30 
        data-[state=checked]:border-white data-[state=checked]:bg-white 
        data-[state=checked]:text-black transition-all duration-200 hover:border-gray-200`}
          />
        )}
      </div>

      {/* Disabled Overlay for Already Selected Items */}
      {isAlreadySelected && (
        <div className="absolute inset-0 bg-black/20 z-5 pointer-events-none">
          <div className="absolute inset-0 border-2 border-purple-600 " />
        </div>
      )}

      {/* Delete Button - Top Right */}
      {!isMediaSelectDialog && onDelete && (
        <div
          className={`absolute top-2 right-2 z-30 transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <TooltipButton
            tooltip="Delete"
            onClick={(e: React.MouseEvent) => onDelete(item.id, e)}
            icon={
              <X
                className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
              />
            }
          />
        </div>
      )}

      {/* Expand Button - Top Right (only in media select dialog mode) */}
      {isMediaSelectDialog && onExpandClick && (
        <div
          className={`absolute top-2 right-2 z-30 transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <TooltipButton
            tooltip="Preview"
            onClick={onExpandClick}
            icon={
              <Expand
                className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
              />
            }
          />
        </div>
      )}

      {/* Direct Action Icons for moodboard assets - Bottom Left */}
      {!isMediaSelectDialog &&
        item.asset_source === "moodboard" &&
        (onEditClick || onEditMoodboard) && (
          <div
            className={`absolute bottom-2 left-2 z-30 flex items-center gap-2 transition-opacity duration-200 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Edit Image Icon */}
            {onEditClick && (
              <TooltipButton
                tooltip="Concept Visual Editor"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onEditClick(item);
                }}
                icon={
                  <PencilIcon
                    className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
                  />
                }
              />
            )}

            {/* Edit Moodboard Layout Icon */}
            {onEditMoodboard && (
              <TooltipButton
                tooltip="Edit Moodboard Layout"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onEditMoodboard(item);
                }}
                icon={
                  <LayoutGridIcon
                    className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
                  />
                }
              />
            )}

            <TooltipButton
              tooltip={
                item.comments && item.comments.length > 0
                  ? `${item.comments.length} comment${
                      item.comments.length > 1 ? "s" : ""
                    }`
                  : "No comments"
              }
              icon={
                <div className="relative">
                  <MessageCircle
                    className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE} text-white`}
                  />
                  {item.comments && item.comments.length > 0 && (
                    <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {item.comments.length}
                    </div>
                  )}
                </div>
              }
              className="transition-all duration-300"
            />
          </div>
        )}

      {/* Edit Button - Bottom Left (non-moodboard assets) */}
      {!isMediaSelectDialog &&
        onEditClick &&
        item.asset_source !== "moodboard" && (
          <>
            <div
              className={`absolute bottom-2 left-2 z-30 flex items-center gap-2 transition-opacity duration-200 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
            >
              <TooltipButton
                tooltip="Concept Visual Editor"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onEditClick(item);
                }}
                icon={
                  <PencilIcon
                    className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
                  />
                }
              />
              <TooltipButton
                tooltip={
                  item.comments && item.comments.length > 0
                    ? `${item.comments.length} comment${
                        item.comments.length > 1 ? "s" : ""
                      }`
                    : "No comments"
                }
                icon={
                  <div className="relative">
                    <MessageCircle
                      className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE} text-white`}
                    />
                    {item.comments && item.comments.length > 0 && (
                      <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {item.comments.length}
                      </div>
                    )}
                  </div>
                }
                className="transition-all duration-300"
              />
            </div>
          </>
        )}

      {/* Download and Favorite Buttons - Bottom Right */}
      <div
        className={`absolute bottom-2 right-2 z-30 flex items-center gap-2 transition-opacity duration-200 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()} // Prevent tile click when clicking action buttons
      >
        <TooltipButton
          tooltip="Download"
          onClick={(e: React.MouseEvent) => onDownload(item, e)}
          icon={
            <DownloadIcon
              className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
            />
          }
        />

        <TooltipButton
          tooltip={item.is_favourite ? "Unlike" : "Like"}
          onClick={handleFavoriteClick}
          icon={
            <HeartIcon
              className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE} ${
                item.is_favourite ? "fill-current" : ""
              }`}
            />
          }
          isActive={item.is_favourite}
          normalColor="text-white hover:text-red-300"
          activeColor="text-red-500"
          className="transition-all duration-300"
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
