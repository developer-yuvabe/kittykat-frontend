"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Heart, Plus, X, Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { GalleryItemResponse } from "@/types/gallery.types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import {
  MoreIcon,
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  SaveIcon,
} from "@/components/ui/custom-icon";

interface MediaItemProps {
  item: GalleryItemResponse;
  isSelected: boolean;
  isHovered: boolean;
  isMediaSelectDialog: boolean;
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
  handleAddComment: (itemId: string, text: string) => Promise<void>;
}

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
}: MediaItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });
  const [editState, setEditState] = useState({
    isEditingTitle: false,
    isEditingComment: false,
    isAddingComment: false,
    title: item.asset_title,
    comment: item.comments?.[0]?.text || "",
    newComment: "",
    isSavingTitle: false,
    isSavingComment: false,
    isAddingCommentLoading: false,
    isDeletingComment: false,
  });

  // Refs for focus management
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const newCommentRef = useRef<HTMLTextAreaElement | null>(null);

  // Focus management
  useEffect(() => {
    if (editState.isEditingTitle && inputRef.current) {
      inputRef.current.focus();
    }
    if (editState.isEditingComment && textareaRef.current) {
      textareaRef.current.focus();
    }
    if (editState.isAddingComment && newCommentRef.current) {
      newCommentRef.current.focus();
    }
  }, [
    editState.isEditingTitle,
    editState.isEditingComment,
    editState.isAddingComment,
  ]);

  const handleImageLoad = (event: any) => {
    const target = event.target as HTMLImageElement;
    setDimensions({
      width: target.naturalWidth,
      height: target.naturalHeight,
    });
    setIsLoaded(true);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(item.id);
  };

  // Title CRUD operations
  const handleEditTitle = () => {
    setEditState((prev) => ({
      ...prev,
      isEditingTitle: true,
    }));
  };

  const handleTitleChange = (newTitle: string) => {
    setEditState((prev) => ({
      ...prev,
      title: newTitle,
    }));
  };

  const handleSaveTitle = async () => {
    if (editState.isSavingTitle) return;

    setEditState((prev) => ({
      ...prev,
      isSavingTitle: true,
    }));

    try {
      await handleUpdateTitle(item.id, editState.title);
      setEditState((prev) => ({
        ...prev,
        isEditingTitle: false,
        isSavingTitle: false,
      }));
    } catch (error) {
      console.error("Error saving title:", error);
      setEditState((prev) => ({
        ...prev,
        isSavingTitle: false,
      }));
    }
  };

  const handleCancelTitleEdit = () => {
    setEditState((prev) => ({
      ...prev,
      isEditingTitle: false,
      title: item.asset_title,
    }));
  };

  // Comment CRUD operations
  const handleEditComment = () => {
    setEditState((prev) => ({
      ...prev,
      isEditingComment: true,
    }));
  };

  const handleCommentChange = (newComment: string) => {
    setEditState((prev) => ({
      ...prev,
      comment: newComment,
    }));
  };

  const handleNewCommentChange = (newComment: string) => {
    setEditState((prev) => ({
      ...prev,
      newComment: newComment,
    }));
  };

  const handleSaveComment = async () => {
    if (editState.isSavingComment) return;

    const commentId = item.comments?.[0]?.id;
    if (!commentId) return;

    setEditState((prev) => ({
      ...prev,
      isSavingComment: true,
    }));

    try {
      await handleUpdateComment(item.id, commentId, editState.comment);
      setEditState((prev) => ({
        ...prev,
        isEditingComment: false,
        isSavingComment: false,
      }));
    } catch (error) {
      console.error("Error saving comment:", error);
      setEditState((prev) => ({
        ...prev,
        isSavingComment: false,
      }));
    }
  };

  const handleAddNewComment = async () => {
    if (editState.isAddingCommentLoading || !editState.newComment.trim())
      return;

    setEditState((prev) => ({
      ...prev,
      isAddingCommentLoading: true,
    }));

    try {
      await handleAddComment(item.id, editState.newComment);
      setEditState((prev) => ({
        ...prev,
        isAddingComment: false,
        isAddingCommentLoading: false,
        newComment: "",
        comment: prev.newComment, // Update the comment field
      }));
    } catch (error) {
      console.error("Error adding comment:", error);
      setEditState((prev) => ({
        ...prev,
        isAddingCommentLoading: false,
      }));
    }
  };

  const handleDeleteCommentClick = async () => {
    if (editState.isDeletingComment) return;

    const commentId = item.comments?.[0]?.id;
    if (!commentId) return;

    setEditState((prev) => ({
      ...prev,
      isDeletingComment: true,
    }));

    try {
      await handleDeleteComment(item.id, commentId);
      setEditState((prev) => ({
        ...prev,
        comment: "",
        isEditingComment: false,
        isDeletingComment: false,
      }));
    } catch (error) {
      console.error("Error deleting comment:", error);
      setEditState((prev) => ({
        ...prev,
        isDeletingComment: false,
      }));
    }
  };

  const handleCancelCommentEdit = () => {
    setEditState((prev) => ({
      ...prev,
      isEditingComment: false,
      comment: item.comments?.[0]?.text || "",
    }));
  };

  const handleStartAddingComment = () => {
    setEditState((prev) => ({
      ...prev,
      isAddingComment: true,
    }));
  };

  const handleCancelAddingComment = () => {
    setEditState((prev) => ({
      ...prev,
      isAddingComment: false,
      newComment: "",
    }));
  };

  const aspectRatio = dimensions.width / dimensions.height;
  const itemComment = item.comments?.[0]?.text || "";
  const hasComment = itemComment.trim() !== "";
  const skeletonHeight = item.dimensions
    ? (300 * item.dimensions.height) / item.dimensions.width
    : Math.floor(Math.random() * 200) + 200;

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
          <Image
            src={item.preview_url || item.asset_url || "/placeholder.svg"}
            alt={item.asset_title}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            onLoad={handleImageLoad}
            quality={30}
            loading="lazy"
          />
        </div>

        {/* Selection checkbox */}
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
              onCheckedChange={(checked) =>
                onSelect(item.id, checked as boolean)
              }
              className="h-5 w-5 border-2 border-white bg-black/30 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black transition-all duration-200"
            />
          </div>
        )}

        {/* Favorite button */}
        <div
          className={`absolute bottom-2 left-2 z-10 transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
          onClick={handleFavoriteClick}
        >
          <Heart
            color={!item.is_favourite ? "#000000" : ""}
            className={`h-4 w-4 transition-all duration-300 ${
              item.is_favourite ? "fill-red-500 text-red-500" : "text-white"
            }`}
          />
        </div>

        {/* More options popover */}
        {isHovered && (
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
                  {/* Title editing section */}
                  <div
                    onDoubleClick={() =>
                      !editState.isEditingTitle && handleEditTitle()
                    }
                    className="relative"
                  >
                    <Input
                      ref={inputRef}
                      value={editState.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="disabled:opacity-100 pr-8"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveTitle();
                        } else if (e.key === "Escape") {
                          handleCancelTitleEdit();
                        }
                      }}
                      disabled={
                        !editState.isEditingTitle || editState.isSavingTitle
                      }
                    />
                    <TooltipIconButton
                      tooltip={
                        editState.isEditingTitle ? "Save Title" : "Edit Title"
                      }
                      variant="ghost"
                      className="h-8 w-8 absolute top-1/2 -translate-y-1/2 right-0 hover:bg-transparent resize-none min-h-max"
                      onClick={() =>
                        editState.isEditingTitle
                          ? handleSaveTitle()
                          : handleEditTitle()
                      }
                      disabled={editState.isSavingTitle}
                    >
                      {editState.isSavingTitle ? (
                        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                      ) : editState.isEditingTitle ? (
                        <SaveIcon size={18} className="" />
                      ) : (
                        <EditIcon size={18} className="" />
                      )}
                    </TooltipIconButton>
                  </div>

                  {/* Image details */}
                  {item.dimensions &&
                    item.media_format &&
                    item.asset_source && (
                      <div className="bg-[#F3F4F6] font-bold text-sm p-4 rounded-md">
                        <div className="space-y-1">
                          <p className="text-gray-800">
                            Size:{" "}
                            {`${item.dimensions.width}x${item.dimensions.height}`}
                          </p>
                          <p className="text-gray-800">
                            Format: {item.media_format}
                          </p>
                          <p className="text-gray-800">
                            Source: {item.asset_source}
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Comment section */}
                  <div className="space-y-2">
                    {/* Existing comment display/edit */}
                    {hasComment && (
                      <div
                        className="relative"
                        onDoubleClick={() => {
                          if (!editState.isEditingComment) {
                            handleEditComment();
                          }
                        }}
                      >
                        <div className="relative">
                          <Textarea
                            disabled={
                              !editState.isEditingComment ||
                              editState.isSavingComment
                            }
                            ref={textareaRef}
                            placeholder="Add comment"
                            value={editState.comment}
                            onChange={(e) =>
                              handleCommentChange(e.target.value)
                            }
                            className="resize-none min-h-[80px] overflow-hidden disabled:opacity-100 pr-20"
                            rows={3}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.ctrlKey) {
                                handleSaveComment();
                              } else if (e.key === "Escape") {
                                handleCancelCommentEdit();
                              }
                            }}
                          />

                          {/* Comment action buttons */}
                          <div className="absolute top-1 right-1 flex gap-1">
                            {!editState.isEditingComment && (
                              <TooltipIconButton
                                tooltip="Delete Comment"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:!bg-red-100 hover:!text-red-600"
                                onClick={handleDeleteCommentClick}
                                disabled={editState.isDeletingComment}
                              >
                                {editState.isDeletingComment ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-red-600 rounded-full" />
                                ) : (
                                  <DeleteIcon size={16} />
                                )}
                              </TooltipIconButton>
                            )}

                            <TooltipIconButton
                              tooltip={
                                editState.isEditingComment
                                  ? "Save Comment"
                                  : "Edit Comment"
                              }
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:!bg-transparent"
                              onClick={() =>
                                editState.isEditingComment
                                  ? handleSaveComment()
                                  : handleEditComment()
                              }
                              disabled={editState.isSavingComment}
                            >
                              {editState.isSavingComment ? (
                                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                              ) : editState.isEditingComment ? (
                                <SaveIcon size={18} className="" />
                              ) : (
                                <EditIcon size={18} className="" />
                              )}
                            </TooltipIconButton>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add new comment section */}
                    {!hasComment && !editState.isAddingComment && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStartAddingComment}
                        className="w-full justify-start gap-2"
                      >
                        <Plus size={16} />
                        Add Comment
                      </Button>
                    )}

                    {!hasComment && editState.isAddingComment && (
                      <div className="relative">
                        <Textarea
                          ref={newCommentRef}
                          placeholder="Write your comment..."
                          value={editState.newComment}
                          onChange={(e) =>
                            handleNewCommentChange(e.target.value)
                          }
                          className="resize-none min-h-[80px] pr-20"
                          rows={3}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.ctrlKey) {
                              handleAddNewComment();
                            } else if (e.key === "Escape") {
                              handleCancelAddingComment();
                            }
                          }}
                        />
                        <div className="absolute top-1 right-1 flex gap-1">
                          <TooltipIconButton
                            tooltip="Cancel"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:!bg-red-100"
                            onClick={handleCancelAddingComment}
                          >
                            <X size={16} />
                          </TooltipIconButton>
                          <TooltipIconButton
                            tooltip="Add Comment"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:!bg-green-100"
                            onClick={handleAddNewComment}
                            disabled={
                              editState.isAddingCommentLoading ||
                              !editState.newComment.trim()
                            }
                          >
                            {editState.isAddingCommentLoading ? (
                              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-green-600 rounded-full" />
                            ) : (
                              <SaveIcon size={16} />
                            )}
                          </TooltipIconButton>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Details button */}
                  <Button
                    variant="ghost"
                    onClick={() => onDetailsClick(item)}
                    className="w-full flex items-center justify-start hover:bg-gray-100 transition-colors cursor-pointer text-left p-2 rounded-md hover:text-foreground"
                  >
                    <Info size={20} />
                    <span className="ml-2">View Details</span>
                  </Button>

                  {/* Download button */}
                  <Button
                    variant="ghost"
                    onClick={(e) => onDownload(item, e)}
                    className="w-full flex items-center justify-start hover:bg-gray-100 transition-colors cursor-pointer text-left p-2 rounded-md hover:text-foreground"
                  >
                    <DownloadIcon size={20} />
                    <span className="ml-2">Download</span>
                  </Button>

                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    onClick={(e) => onDelete(item.id, e)}
                    className="w-full flex items-center justify-start hover:bg-gray-100 transition-colors cursor-pointer text-left p-2 rounded-md hover:text-foreground"
                  >
                    <DeleteIcon size={20} />
                    <span className="ml-2">Delete</span>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
}
