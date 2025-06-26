"use client";

import type React from "react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { GalleryItemResponse } from "@/types/gallery.types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { MoreIcon } from "@/components/ui/custom-icon";
import { MediaOverlay } from "./MediaOverlay";
import { MediaItemCommentSection } from "./MediaItemCommentSection";
import { MediaItemEditableTitle } from "./MediaItemEditableTitle";
import { MediaImage } from "./MediaImage";
import { MediaItemActionsButton } from "./MediaItemActionsButton";
import { MediaImageDetails } from "./MediaImageDetails";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";
import { MediaEditorDialog } from "./MediaEditorDialog";

// Types
interface MediaItemProps {
  item: GalleryItemResponse;
  isSelected: boolean;
  isHovered: boolean;
  isMediaSelectDialog?: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onDownload: (item: GalleryItemResponse, e: React.MouseEvent) => void;
  onDetailsClick: (item: GalleryItemResponse) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  handleUpdateTitle: (itemId: string, newTitle: string) => Promise<void>;
  handleUpdateComment: (
    itemId: string,
    commentId: string,
    text: string
  ) => Promise<void>;
  handleDeleteComment: (itemId: string, commentId: string) => Promise<void>;
  handleAddComment: (
    itemId: string,
    text: string,
    attachments: string[] | undefined
  ) => Promise<void>;
  inSelectionGalleryIds?: string[];
  isMultiSelect?: boolean;
  selectedCount?: number;
  maxSelectionCount?: number;
}

// Main MediaItem Component
export function MediaItem({
  item,
  isSelected,
  isHovered,
  isMediaSelectDialog,
  onSelect,
  onToggleFavorite,
  onDelete,
  onDownload,
  onDetailsClick,
  onMouseEnter,
  onMouseLeave,
  handleUpdateTitle,
  handleUpdateComment,
  handleDeleteComment,
  handleAddComment,
  inSelectionGalleryIds,
  isMultiSelect,
  selectedCount,
  maxSelectionCount,
}: MediaItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });

  const isAlreadySelected = (inSelectionGalleryIds ?? []).includes(item.id);
  const isDisabled = isAlreadySelected && isMultiSelect;

  const handleImageLoad = (event: any) => {
    const target = event.target as HTMLImageElement;
    setDimensions({
      width: target.naturalWidth,
      height: target.naturalHeight,
    });
    setIsLoaded(true);
  };

  const aspectRatio = dimensions.width / dimensions.height;
  const skeletonHeight = item.dimensions
    ? (300 * item.dimensions.height) / item.dimensions.width
    : Math.floor(Math.random() * 200) + 200;

  const [editorOpen, setEditorOpen] = useState(false);

  const handleUpdateCommentWithAttachments = async (
    itemId: string,
    commentId: string,
    text: string
  ) => {
    await handleUpdateComment(itemId, commentId, text);
  };

  const handleAddReply = async (
    itemId: string,
    commentId: string,
    text: string,
    attachments?: string[]
  ) => {
    // Implementation for adding replies
    console.log("Adding reply:", { itemId, commentId, text, attachments });
  };

  const handleUpdateReply = async (
    itemId: string,
    commentId: string,
    replyId: string,
    text: string
  ) => {
    // Implementation for updating replies
    console.log("Updating reply:", { itemId, commentId, replyId, text });
  };

  const handleDeleteReply = async (
    itemId: string,
    commentId: string,
    replyId: string
  ) => {
    // Implementation for deleting replies
    console.log("Deleting reply:", { itemId, commentId, replyId });
  };

  const handleAskKittyKat = async (
    itemId: string,
    message: string,
    attachments?: string[]
  ) => {
    // Implementation for Ask KittyKat functionality
    console.log("Asking KittyKat:", { itemId, message, attachments });
  };

  return (
    <div
      className="mb-4 relative group overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {!isLoaded && (
        <div className="w-full">
          <Skeleton
            className="w-full rounded-lg"
            style={{ height: `${skeletonHeight}px` }}
          />
        </div>
      )}

      <div
        className={`relative w-full transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0 absolute"
        }`}
        style={{
          paddingBottom: isLoaded ? `${(1 / aspectRatio) * 100}%` : undefined,
        }}
      >
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <MediaImage item={item} onImageLoad={handleImageLoad} />
        </div>

        <MediaOverlay
          item={item}
          isSelected={isSelected}
          isHovered={isHovered}
          isMediaSelectDialog={isMediaSelectDialog}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
          isAlreadySelected={isAlreadySelected}
          isDisabled={isDisabled}
          isMultiSelectMode={isMultiSelect}
          maxSelectionCount={maxSelectionCount}
          selectedCount={selectedCount}
        />

        {/* More options popover */}
        {isHovered && (
          <>
            <div className="absolute top-0 right-1 z-10 flex space-x-1">
              <Popover>
                <PopoverTrigger asChild>
                  <TooltipIconButton
                    tooltip="More"
                    className="hover:bg-black/50 "
                  >
                    <MoreIcon size={24} color="#ffffff" />
                  </TooltipIconButton>
                </PopoverTrigger>
                <PopoverContent
                  className="w-72 h-max max-h-128 overflow-auto p-2"
                  side="right"
                >
                  <div className="space-y-2">
                    <MediaItemEditableTitle
                      item={item}
                      onUpdateTitle={handleUpdateTitle}
                    />

                    <MediaImageDetails item={item} />

                    <MediaItemCommentSection
                      item={item}
                      onUpdateComment={handleUpdateComment}
                      onDeleteComment={handleDeleteComment}
                      onAddComment={handleAddComment}
                    />

                    <MediaItemActionsButton
                      item={item}
                      onDetailsClick={onDetailsClick}
                      onDownload={onDownload}
                      onDelete={onDelete}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Button
              size="sm"
              className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-gray-700 shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                setEditorOpen(true);
              }}
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
      <MediaEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        item={item}
        onAddComment={handleAddComment}
        onUpdateComment={handleUpdateCommentWithAttachments}
        onDeleteComment={handleDeleteComment}
        onAddReply={handleAddReply}
        onUpdateReply={handleUpdateReply}
        onDeleteReply={handleDeleteReply}
        onAskKittyKat={handleAskKittyKat}
      />
    </div>
  );
}
