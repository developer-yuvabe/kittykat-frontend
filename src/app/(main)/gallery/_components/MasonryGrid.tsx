"use client";

import type React from "react";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Masonry from "react-masonry-css";
import { Heart, Plus, X, Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import type { GalleryItemResponse, GalleryItem } from "@/types/gallery.types";
import { UseMutateFunction } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { MoreIcon } from "@/components/ui/custom-icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  SaveIcon,
} from "@/components/ui/custom-icon";

interface MasonryGridProps {
  items: GalleryItemResponse[];
  selectedItems: string[];
  onSelect: (id: string, selected: boolean) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (item: GalleryItemResponse) => void;
  isMediaSelectDialog: boolean;
  handleUpdateTitle: (itemId: string, newTitle: string) => Promise<void>;
  handleUpdateComment: (
    itemId: string,
    commentId: string,
    text: string
  ) => Promise<void>;
  handleDeleteComment: (itemId: string, commentId: string) => Promise<void>;
  handleAddComment: (itemId: string, text: string) => Promise<void>;
  handleUpdatePartialData: UseMutateFunction<
    GalleryItemResponse,
    Error,
    {
      itemId: string;
      data: Partial<GalleryItem>;
    },
    unknown
  >;
}

export function MasonryGrid({
  items,
  selectedItems,
  onSelect,
  onToggleFavorite,
  onDelete,
  onDownload,
  isMediaSelectDialog,
  handleUpdateTitle,
  handleUpdateComment,
  handleDeleteComment,
  handleAddComment,
  handleUpdatePartialData,
}: MasonryGridProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [imageDimensions, setImageDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});

  // State for editing titles and comments per item
  const [editingStates, setEditingStates] = useState<
    Record<
      string,
      {
        isEditingTitle: boolean;
        isEditingComment: boolean;
        isAddingComment: boolean;
        title: string;
        comment: string;
        newComment: string;
        isSavingTitle: boolean;
        isSavingComment: boolean;
        isAddingCommentLoading: boolean;
        isDeletingComment: boolean;
      }
    >
  >({});

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] =
    useState<GalleryItemResponse | null>(null);

  // Refs for focus management
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const newCommentRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // Initialize editing states for items
  useEffect(() => {
    items.forEach((item) => {
      if (!editingStates[item.id]) {
        setEditingStates((prev) => ({
          ...prev,
          [item.id]: {
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
          },
        }));
      }
    });
  }, [items]);

  // Focus management
  useEffect(() => {
    Object.keys(editingStates).forEach((itemId) => {
      const state = editingStates[itemId];
      if (state?.isEditingTitle && inputRefs.current[itemId]) {
        inputRefs.current[itemId]?.focus();
      }
      if (state?.isEditingComment && textareaRefs.current[itemId]) {
        textareaRefs.current[itemId]?.focus();
      }
      if (state?.isAddingComment && newCommentRefs.current[itemId]) {
        newCommentRefs.current[itemId]?.focus();
      }
    });
  }, [editingStates]);

  const breakpointColumnsObj = {
    default: 5,
    1536: 4,
    1280: 4,
    1024: 3,
    768: 2,
    640: 2,
    500: 1,
  };

  const handleImageLoad = (id: string, event: any) => {
    const target = event.target as HTMLImageElement;
    setImageDimensions((prev) => ({
      ...prev,
      [id]: {
        width: target.naturalWidth,
        height: target.naturalHeight,
      },
    }));
    setLoadedImages((prev) => new Set(prev).add(id));
  };

  const handleFavoriteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(id);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDownloadClick = (
    item: GalleryItemResponse,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    onDownload(item);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete);
      setItemToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const handleDetailsClick = (item: GalleryItemResponse) => {
    setSelectedItemForDetails(item);
    setDetailsDialogOpen(true);
  };

  // Title CRUD operations
  const handleEditTitle = (itemId: string) => {
    setEditingStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isEditingTitle: true,
      },
    }));
  };

  const handleTitleChange = (itemId: string, newTitle: string) => {
    setEditingStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        title: newTitle,
      },
    }));
  };

  const handleSaveTitle = async (itemId: string) => {
    const currentState = editingStates[itemId];
    if (!currentState || currentState.isSavingTitle) return;

    setEditingStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isSavingTitle: true,
      },
    }));

    try {
      await handleUpdateTitle(itemId, currentState.title);
      setEditingStates((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          isEditingTitle: false,
          isSavingTitle: false,
        },
      }));
    } catch (error) {
      console.error("Error saving title:", error);
      setEditingStates((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          isSavingTitle: false,
        },
      }));
    }
  };

  const handleCancelTitleEdit = (itemId: string, originalTitle: string) => {
    setEditingStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isEditingTitle: false,
        title: originalTitle,
      },
    }));
  };

  // Comment CRUD operations
  const handleEditComment = (itemId: string) => {
    setEditingStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isEditingComment: true,
      },
    }));
  };

  const handleCommentChange = (itemId: string, newComment: string) => {
    setEditingStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        comment: newComment,
      },
    }));
  };

  const handleNewCommentChange = (itemId: string, newComment: string) => {
    setEditingStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        newComment: newComment,
      },
    }));
  };

  const handleSaveComment = async (itemId: string) => {
    const currentState = editingStates[itemId];
    if (!currentState || currentState.isSavingComment) return;

    const item = items.find((i) => i.id === itemId);
    const commentId = item?.comments?.[0]?.id;

    if (!commentId) return;

    setEditingStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isSavingComment: true,
      },
    }));

    try {
      await handleUpdateComment(itemId, commentId, currentState.comment);
      setEditingStates((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          isEditingComment: false,
          isSavingComment: false,
        },
      }));
    } catch (error) {
      console.error("Error saving comment:", error);
      setEditingStates((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          isSavingComment: false,
        },
      }));
    }
  };

  const handleAddNewComment = async (itemId: string) => {
    const currentState = editingStates[itemId];
    if (
      !currentState ||
      currentState.isAddingCommentLoading ||
      !currentState.newComment.trim()
    )
      return;

    setEditingStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isAddingCommentLoading: true,
      },
    }));

    try {
      await handleAddComment(itemId, currentState.newComment);
      setEditingStates((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          isAddingComment: false,
          isAddingCommentLoading: false,
          newComment: "",
          comment: currentState.newComment, // Update the comment field
        },
      }));
    } catch (error) {
      console.error("Error adding comment:", error);
      setEditingStates((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          isAddingCommentLoading: false,
        },
      }));
    }
  };

  const handleDeleteCommentClick = async (itemId: string) => {
    const currentState = editingStates[itemId];
    if (!currentState || currentState.isDeletingComment) return;

    const item = items.find((i) => i.id === itemId);
    const commentId = item?.comments?.[0]?.id;

    if (!commentId) return;

    setEditingStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isDeletingComment: true,
      },
    }));

    try {
      await handleDeleteComment(itemId, commentId);
      setEditingStates((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          comment: "",
          isEditingComment: false,
          isDeletingComment: false,
        },
      }));
    } catch (error) {
      console.error("Error deleting comment:", error);
      setEditingStates((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          isDeletingComment: false,
        },
      }));
    }
  };

  const handleCancelCommentEdit = (itemId: string, originalComment: string) => {
    setEditingStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isEditingComment: false,
        comment: originalComment,
      },
    }));
  };

  const handleStartAddingComment = (itemId: string) => {
    setEditingStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isAddingComment: true,
      },
    }));
  };

  const handleCancelAddingComment = (itemId: string) => {
    setEditingStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isAddingComment: false,
        newComment: "",
      },
    }));
  };

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto -ml-4"
        columnClassName="pl-4 bg-clip-padding"
      >
        {items.map((item) => {
          const isLoaded = loadedImages.has(item.id);
          const dimensions = imageDimensions[item.id] || {
            width: 1,
            height: 1,
          };
          const aspectRatio = dimensions.width / dimensions.height;
          const itemComment = item.comments?.[0]?.text || "";
          const hasComment = itemComment.trim() !== "";
          const currentState = editingStates[item.id] || {
            isEditingTitle: false,
            isEditingComment: false,
            isAddingComment: false,
            title: item.asset_title,
            comment: itemComment,
            newComment: "",
            isSavingTitle: false,
            isSavingComment: false,
            isAddingCommentLoading: false,
            isDeletingComment: false,
          };

          const skeletonHeight = item.dimensions
            ? (300 * item.dimensions.height) / item.dimensions.width
            : Math.floor(Math.random() * 200) + 200;

          return (
            <div
              key={item.id}
              className="mb-4 relative group overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
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
                  paddingBottom: isLoaded
                    ? `${(1 / aspectRatio) * 100}%`
                    : undefined,
                }}
              >
                <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                  <Image
                    src={
                      item.preview_url || item.asset_url || "/placeholder.svg"
                    }
                    alt={item.asset_title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    onLoad={(e) => handleImageLoad(item.id, e)}
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
                      hoveredItem === item.id || selectedItems.includes(item.id)
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                    onClick={() => {
                      console.log("Select button clicked for", item.id);
                      console.log(item);
                    }}
                  >
                    Select
                  </Button>
                ) : (
                  <div
                    className={`absolute top-2 left-2 z-10 transition-opacity duration-200 ${
                      hoveredItem === item.id || selectedItems.includes(item.id)
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  >
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
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
                    hoveredItem === item.id ? "opacity-100" : "opacity-0"
                  }`}
                  onClick={(e) => handleFavoriteClick(item.id, e)}
                >
                  <Heart
                    color={!item.is_favourite ? "#000000" : ""}
                    className={`h-4 w-4 transition-all duration-300 ${
                      item.is_favourite
                        ? "fill-red-500 text-red-500"
                        : "text-white"
                    }`}
                  />
                </div>

                {/* More options popover */}
                {hoveredItem === item.id && (
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
                              !currentState.isEditingTitle &&
                              handleEditTitle(item.id)
                            }
                            className="relative"
                          >
                            <Input
                              ref={(el) => {
                                inputRefs.current[item.id] = el;
                              }}
                              value={currentState.title}
                              onChange={(e) =>
                                handleTitleChange(item.id, e.target.value)
                              }
                              className="disabled:opacity-100 pr-8"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveTitle(item.id);
                                } else if (e.key === "Escape") {
                                  handleCancelTitleEdit(
                                    item.id,
                                    item.asset_title
                                  );
                                }
                              }}
                              disabled={
                                !currentState.isEditingTitle ||
                                currentState.isSavingTitle
                              }
                            />
                            <TooltipIconButton
                              tooltip={
                                currentState.isEditingTitle
                                  ? "Save Title"
                                  : "Edit Title"
                              }
                              variant="ghost"
                              className="h-8 w-8 absolute top-1/2 -translate-y-1/2 right-0 hover:bg-transparent resize-none min-h-max"
                              onClick={() =>
                                currentState.isEditingTitle
                                  ? handleSaveTitle(item.id)
                                  : handleEditTitle(item.id)
                              }
                              disabled={currentState.isSavingTitle}
                            >
                              {currentState.isSavingTitle ? (
                                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                              ) : currentState.isEditingTitle ? (
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
                                  if (!currentState.isEditingComment) {
                                    handleEditComment(item.id);
                                  }
                                }}
                              >
                                <div className="relative">
                                  <Textarea
                                    disabled={
                                      !currentState.isEditingComment ||
                                      currentState.isSavingComment
                                    }
                                    ref={(el) => {
                                      textareaRefs.current[item.id] = el;
                                    }}
                                    placeholder="Add comment"
                                    value={currentState.comment}
                                    onChange={(e) =>
                                      handleCommentChange(
                                        item.id,
                                        e.target.value
                                      )
                                    }
                                    className="resize-none min-h-[80px] overflow-hidden disabled:opacity-100 pr-20"
                                    rows={3}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && e.ctrlKey) {
                                        handleSaveComment(item.id);
                                      } else if (e.key === "Escape") {
                                        handleCancelCommentEdit(
                                          item.id,
                                          itemComment
                                        );
                                      }
                                    }}
                                  />

                                  {/* Comment action buttons */}
                                  <div className="absolute top-1 right-1 flex gap-1">
                                    {!currentState.isEditingComment && (
                                      <TooltipIconButton
                                        tooltip="Delete Comment"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:!bg-red-100 hover:!text-red-600"
                                        onClick={() =>
                                          handleDeleteCommentClick(item.id)
                                        }
                                        disabled={
                                          currentState.isDeletingComment
                                        }
                                      >
                                        {currentState.isDeletingComment ? (
                                          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-red-600 rounded-full" />
                                        ) : (
                                          <DeleteIcon size={16} />
                                        )}
                                      </TooltipIconButton>
                                    )}

                                    <TooltipIconButton
                                      tooltip={
                                        currentState.isEditingComment
                                          ? "Save Comment"
                                          : "Edit Comment"
                                      }
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:!bg-transparent"
                                      onClick={() =>
                                        currentState.isEditingComment
                                          ? handleSaveComment(item.id)
                                          : handleEditComment(item.id)
                                      }
                                      disabled={currentState.isSavingComment}
                                    >
                                      {currentState.isSavingComment ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                                      ) : currentState.isEditingComment ? (
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
                            {!hasComment && !currentState.isAddingComment && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleStartAddingComment(item.id)
                                }
                                className="w-full justify-start gap-2"
                              >
                                <Plus size={16} />
                                Add Comment
                              </Button>
                            )}

                            {!hasComment && currentState.isAddingComment && (
                              <div className="relative">
                                <Textarea
                                  ref={(el) => {
                                    newCommentRefs.current[item.id] = el;
                                  }}
                                  placeholder="Write your comment..."
                                  value={currentState.newComment}
                                  onChange={(e) =>
                                    handleNewCommentChange(
                                      item.id,
                                      e.target.value
                                    )
                                  }
                                  className="resize-none min-h-[80px] pr-20"
                                  rows={3}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && e.ctrlKey) {
                                      handleAddNewComment(item.id);
                                    } else if (e.key === "Escape") {
                                      handleCancelAddingComment(item.id);
                                    }
                                  }}
                                />
                                <div className="absolute top-1 right-1 flex gap-1">
                                  <TooltipIconButton
                                    tooltip="Cancel"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:!bg-red-100"
                                    onClick={() =>
                                      handleCancelAddingComment(item.id)
                                    }
                                  >
                                    <X size={16} />
                                  </TooltipIconButton>
                                  <TooltipIconButton
                                    tooltip="Add Comment"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:!bg-green-100"
                                    onClick={() => handleAddNewComment(item.id)}
                                    disabled={
                                      currentState.isAddingCommentLoading ||
                                      !currentState.newComment.trim()
                                    }
                                  >
                                    {currentState.isAddingCommentLoading ? (
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
                            onClick={() => handleDetailsClick(item)}
                            className="w-full flex items-center justify-start hover:bg-gray-100 transition-colors cursor-pointer text-left p-2 rounded-md hover:text-foreground"
                          >
                            <Info size={20} />
                            <span className="ml-2">View Details</span>
                          </Button>

                          {/* Download button */}
                          <Button
                            variant="ghost"
                            onClick={(e) => handleDownloadClick(item, e)}
                            className="w-full flex items-center justify-start hover:bg-gray-100 transition-colors cursor-pointer text-left p-2 rounded-md hover:text-foreground"
                          >
                            <DownloadIcon size={20} />
                            <span className="ml-2">Download</span>
                          </Button>

                          {/* Delete button */}
                          <Button
                            variant="ghost"
                            onClick={(e) => handleDeleteClick(item.id, e)}
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
        })}
      </Masonry>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className=" h-[90vh] lg:min-w-7xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
          </DialogHeader>

          {selectedItemForDetails && (
            <DetailsTabs
              item={selectedItemForDetails}
              handleUpdatePartialData={handleUpdatePartialData}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <ReusableAlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        danger={true}
      />
    </>
  );
}

// Details Tabs Component
interface DetailsTabsProps {
  item: GalleryItemResponse;
  handleUpdatePartialData: UseMutateFunction<
    GalleryItemResponse,
    Error,
    { itemId: string; data: Partial<GalleryItem> },
    unknown
  >;
}

function DetailsTabs({ item, handleUpdatePartialData }: DetailsTabsProps) {
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>(
    {}
  );
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [savingFields, setSavingFields] = useState<Record<string, boolean>>({});

  const handleFieldEdit = (fieldKey: string, currentValue: any) => {
    setEditingFields((prev) => ({ ...prev, [fieldKey]: true }));
    setFieldValues((prev) => ({ ...prev, [fieldKey]: currentValue }));
  };

  const handleFieldSave = async (fieldKey: string, value: any) => {
    setSavingFields((prev) => ({ ...prev, [fieldKey]: true }));

    try {
      const updateData: Partial<GalleryItem> = { [fieldKey]: value };
      await handleUpdatePartialData({ itemId: item.id, data: updateData });

      setEditingFields((prev) => ({ ...prev, [fieldKey]: false }));
      setSavingFields((prev) => ({ ...prev, [fieldKey]: false }));
    } catch (error) {
      console.error(`Error updating ${fieldKey}:`, error);
      setSavingFields((prev) => ({ ...prev, [fieldKey]: false }));
    }
  };

  const handleFieldCancel = (fieldKey: string) => {
    setEditingFields((prev) => ({ ...prev, [fieldKey]: false }));
    setFieldValues((prev) => ({ ...prev, [fieldKey]: undefined }));
  };

  const renderEditableField = (
    label: string,
    fieldKey: string,
    currentValue: any,
    type: "text" | "textarea" | "number" | "boolean" | "array" = "text",
    editable: boolean = true
  ) => {
    const isEditing = editingFields[fieldKey];
    const isSaving = savingFields[fieldKey];
    const editValue = fieldValues[fieldKey] ?? currentValue;

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          {type === "boolean" ? (
            <div className="flex items-center gap-2">
              <Switch
                checked={isEditing ? editValue : currentValue}
                onCheckedChange={(checked) => {
                  if (!editable) return;
                  if (isEditing) {
                    setFieldValues((prev) => ({
                      ...prev,
                      [fieldKey]: checked,
                    }));
                  } else {
                    handleFieldEdit(fieldKey, checked);
                    setFieldValues((prev) => ({
                      ...prev,
                      [fieldKey]: checked,
                    }));
                  }
                }}
                disabled={isSaving || !editable}
              />
              <span className="text-sm text-gray-600">
                {isEditing
                  ? editValue
                    ? "Yes"
                    : "No"
                  : currentValue
                  ? "Yes"
                  : "No"}
              </span>
            </div>
          ) : type === "array" ? (
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={Array.isArray(editValue) ? editValue.join(", ") : ""}
                  onChange={(e) =>
                    setFieldValues((prev) => ({
                      ...prev,
                      [fieldKey]: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="Enter comma-separated values"
                  disabled={isSaving || !editable}
                />
              ) : (
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(currentValue) && currentValue.length > 0 ? (
                    currentValue.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">No tags</span>
                  )}
                </div>
              )}
            </div>
          ) : type === "textarea" ? (
            <Textarea
              value={isEditing ? editValue : currentValue || ""}
              onChange={(e) =>
                setFieldValues((prev) => ({
                  ...prev,
                  [fieldKey]: e.target.value,
                }))
              }
              disabled={!isEditing || isSaving || !editable}
              className="flex-1 disabled:opacity-100"
              rows={3}
            />
          ) : (
            <Input
              type={type}
              value={isEditing ? editValue : currentValue || ""}
              onChange={(e) =>
                setFieldValues((prev) => ({
                  ...prev,
                  [fieldKey]:
                    type === "number"
                      ? e.target.value === ""
                        ? null
                        : Number(e.target.value)
                      : e.target.value,
                }))
              }
              disabled={!isEditing || isSaving || !editable}
              className="flex-1 disabled:opacity-100"
            />
          )}

          {editable && type !== "boolean" && (
            <div className="flex gap-1">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFieldCancel(fieldKey)}
                    disabled={isSaving}
                  >
                    <X size={16} />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleFieldSave(fieldKey, editValue)}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                    ) : (
                      <SaveIcon size={16} />
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFieldEdit(fieldKey, currentValue)}
                >
                  <EditIcon size={16} />
                </Button>
              )}
            </div>
          )}

          {type === "boolean" && editable && isEditing && (
            <Button
              size="sm"
              onClick={() => handleFieldSave(fieldKey, editValue)}
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
              ) : (
                <SaveIcon size={16} />
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Tabs defaultValue="basic" className="w-full px-2 fixed mt-16  ">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="ai">AI & Generation</TabsTrigger>
        <TabsTrigger value="model">Model Info</TabsTrigger>
        <TabsTrigger value="product">Product</TabsTrigger>
        <TabsTrigger value="workflow">Workflow</TabsTrigger>
        <TabsTrigger value="system">System</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4 p-10">
        <div className="grid grid-cols-2 gap-4">
          {renderEditableField("Title", "asset_title", item.asset_title)}
          {renderEditableField("Asset Type", "asset_type", item.asset_type)}
          {renderEditableField("Source", "asset_source", item.asset_source)}
          {renderEditableField(
            "Media Format",
            "media_format",
            item.media_format,
            "text",
            false
          )}
          {renderEditableField("Size", "size", item.size, "text", false)}
          {/* Only show duration for video media format */}
          {item.media_format?.toLowerCase().includes("video") &&
            renderEditableField(
              "Duration (seconds)",
              "duration_seconds",
              item.duration_seconds,
              "number"
            )}
          {renderEditableField(
            "Alt Text",
            "alt_text",
            item.alt_text,
            "textarea"
          )}
          {renderEditableField(
            "Is Favorite",
            "is_favourite",
            item.is_favourite,
            "boolean"
          )}
          {renderEditableField(
            "Is Archived",
            "is_archived",
            item.is_archived,
            "boolean"
          )}
        </div>

        {item.dimensions && (
          <div className="space-y-2">
            <Label>Dimensions</Label>
            <div className="grid grid-cols-2 gap-2">
              {renderEditableField(
                "Width",
                "dimensions.width",
                item.dimensions?.width,
                "number"
              )}
              {renderEditableField(
                "Height",
                "dimensions.height",
                item.dimensions?.height,
                "number"
              )}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="ai" className="space-y-4 mt-4 p-10">
        <div className="grid grid-cols-1 gap-4">
          {item.generation_engine &&
            renderEditableField(
              "Generation Engine",
              "generation_engine",
              item.generation_engine
            )}
          {item.input_prompt &&
            renderEditableField(
              "Input Prompt",
              "input_prompt",
              item.input_prompt,
              "textarea"
            )}
          {renderEditableField(
            "AI Description",
            "ai_description",
            item.ai_description,
            "textarea"
          )}
          {renderEditableField(
            "Dominant Color",
            "dominant_color",
            item.dominant_color
          )}
          {renderEditableField(
            "Technical Quality Score",
            "technical_quality_score",
            item.technical_quality_score,
            "number"
          )}
          {renderEditableField(
            "Brand Compliance Score",
            "brand_compliance_score",
            item.brand_compliance_score,
            "number"
          )}
        </div>

        <div className="space-y-4">
          {item.prompt_modifiers.length > 0 &&
            renderEditableField(
              "Prompt Modifiers",
              "prompt_modifiers",
              item.prompt_modifiers,
              "array"
            )}
          {renderEditableField("AI Tags", "ai_tags", item.ai_tags, "array")}
          {renderEditableField(
            "Visual Style Tags",
            "visual_style_tags",
            item.visual_style_tags,
            "array"
          )}
          {renderEditableField(
            "Detected Objects",
            "detected_objects",
            item.detected_objects,
            "array"
          )}
          {renderEditableField(
            "Detected Emotions",
            "detected_emotions",
            item.detected_emotions,
            "array"
          )}
          {renderEditableField(
            "Detected Colors",
            "detected_colors",
            item.detected_colors,
            "array"
          )}
        </div>
      </TabsContent>

      <TabsContent value="model" className="space-y-4 mt-4 p-10">
        <div className="grid grid-cols-2 gap-4">
          {renderEditableField(
            "Has Human Model",
            "has_human_model",
            item.has_human_model,
            "boolean"
          )}
        </div>

        {item.model_data && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Model Data</h3>
            <div className="grid grid-cols-2 gap-4">
              {renderEditableField(
                "Model Type",
                "model_data.model_type",
                item.model_data.model_type
              )}
              {renderEditableField(
                "Gender",
                "model_data.gender",
                item.model_data.gender
              )}
              {renderEditableField(
                "Ethnicity",
                "model_data.ethnicity",
                item.model_data.ethnicity
              )}
              {renderEditableField(
                "Age Range",
                "model_data.age_range",
                item.model_data.age_range
              )}
              {renderEditableField(
                "Face Visible",
                "model_data.face_visible",
                item.model_data.face_visible,
                "boolean"
              )}
              {renderEditableField(
                "Body Type",
                "model_data.body_type",
                item.model_data.body_type
              )}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="product" className="space-y-4 mt-4 p-10">
        <div className="grid grid-cols-2 gap-4">
          {renderEditableField(
            "Has Product",
            "has_product",
            item.has_product,
            "boolean"
          )}
        </div>

        {item.product_data && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Product Data</h3>
            <div className="grid grid-cols-2 gap-4">
              {renderEditableField(
                "Product Category",
                "product_data.product_category",
                item.product_data.product_category
              )}
              {renderEditableField(
                "SKU",
                "product_data.sku",
                item.product_data.sku
              )}
              {renderEditableField(
                "SKU Reference",
                "product_data.sku_reference",
                item.product_data.sku_reference
              )}
              {renderEditableField(
                "Product Visibility",
                "product_data.product_visibility",
                item.product_data.product_visibility
              )}
              {renderEditableField(
                "Product Placement",
                "product_data.product_placement",
                item.product_data.product_placement
              )}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="workflow" className="space-y-4 mt-4 p-10 ">
        <div className="grid grid-cols-2 gap-4">
          {renderEditableField(
            "Workflow Status",
            "workflow_status",
            item.workflow_status
          )}
          {renderEditableField(
            "User Feedback",
            "user_feedback",
            item.user_feedback
          )}
          {renderEditableField("Campaign ID", "campaign_id", item.campaign_id)}
          {renderEditableField(
            "Usage Count",
            "usage_count",
            item.usage_count,
            "number"
          )}

          {renderEditableField(
            "Has Feedback",
            "has_feedback",
            item.has_feedback,
            "boolean"
          )}
        </div>

        <div className="space-y-4">
          {renderEditableField(
            "Search Keywords",
            "search_keywords",
            item.search_keywords,
            "array"
          )}
          {renderEditableField(
            "Custom Tags",
            "custom_tags",
            item.custom_tags,
            "array"
          )}
          {renderEditableField(
            "Approved Channels",
            "approved_channels",
            item.approved_channels,
            "array"
          )}
          {renderEditableField(
            "Region Restrictions",
            "region_restrictions",
            item.region_restrictions,
            "array"
          )}
          {renderEditableField(
            "Content Warnings",
            "content_warnings",
            item.content_warnings,
            "array"
          )}
        </div>
      </TabsContent>

      <TabsContent value="system" className="space-y-4 mt-4 p-10">
        <div className="grid grid-cols-2 gap-4">
          {renderEditableField(
            "Processing Status",
            "processing_status",
            item.processing_status
          )}
          {renderEditableField("Brand ID", "brand_id", item.brand_id)}
          {renderEditableField("Created By", "created_by", item.created_by)}
          {renderEditableField(
            "Size (Bytes)",
            "size_bytes",
            item.size_bytes,
            "number"
          )}
          {renderEditableField(
            "Aspect Ratio",
            "aspect_ratio",
            item.aspect_ratio
          )}
        </div>

        <div className="space-y-2">
          <Label>Timestamps</Label>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs text-gray-500">Created At</Label>
              <p>{new Date(item.created_at).toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Updated At</Label>
              <p>{new Date(item.updated_at).toLocaleString()}</p>
            </div>
            {item.last_accessed_at && (
              <div>
                <Label className="text-xs text-gray-500">Last Accessed</Label>
                <p>{new Date(item.last_accessed_at).toLocaleString()}</p>
              </div>
            )}
            {item.last_commented_at && (
              <div>
                <Label className="text-xs text-gray-500">Last Commented</Label>
                <p>{new Date(item.last_commented_at).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {item.metadata_raw && (
          <div className="space-y-2">
            <Label>Raw Metadata</Label>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(item.metadata_raw, null, 2)}
            </pre>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
