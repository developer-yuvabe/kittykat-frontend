"use client";

import type React from "react";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Masonry from "react-masonry-css";
import { Heart, Download, Trash2, Ellipsis } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { GalleryItemResponse } from "@/types/gallery.types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { DislikeIcon, LikeIcon, MoreIcon } from "@/components/ui/custom-icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  LibraryIcon,
  SaveIcon,
} from "@/components/ui/custom-icon";

interface MasonryGridProps {
  items: GalleryItemResponse[];
  selectedItems: string[];
  onSelect: (id: string, selected: boolean) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (item: GalleryItemResponse) => void;
}

export function MasonryGrid({
  items,
  selectedItems,
  onSelect,
  onToggleFavorite,
  onDelete,
  onDownload,
}: MasonryGridProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [imageDimensions, setImageDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
    }

    if (isEditingComment && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditingTitle, isEditingComment]);

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

    // Store natural dimensions for aspect ratio
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

  const handleEditTitle = () => {
    setIsEditingTitle(true);
  };

  const handleEditComment = () => {
    setIsEditingComment(true);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);

    // Show save button when first character is typed
    if (!isEditingComment && e.target.value.trim().length > 0) {
      setIsEditingComment(true);
    }
  };

  const handleSaveComment = async () => {};

  const handleDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete); // actual delete logic
      setItemToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const handleSaveTitle = async () => {};

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex w-auto -ml-4"
      columnClassName="pl-4 bg-clip-padding"
    >
      {items.map((item) => {
        const isLoaded = loadedImages.has(item.id);
        const dimensions = imageDimensions[item.id] || { width: 1, height: 1 };
        const aspectRatio = dimensions.width / dimensions.height;
        const itemComment = item.comments?.[0]?.text || "";

        return (
          <div
            key={item.id}
            className={`mb-4 relative group  overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div
              className="relative w-full"
              style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                <Image
                  src={item.asset_url || "/placeholder.svg"}
                  alt={item.asset_title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  onLoad={(e) => handleImageLoad(item.id, e)}
                />
              </div>

              {/* Selection checkbox - only visible on hover or when selected */}
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

              {/* Favorite button - always visible but more prominent on hover */}
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

              {/* Action buttons - only visible on hover */}
              {/* {hoveredItem === item.id && (
                <div className="absolute bottom-2 right-2 z-10 flex space-x-1">
                  <button
                    className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors duration-200 text-white"
                    onClick={(e) => handleDownloadClick(item, e)}
                    aria-label="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1.5 rounded-full bg-black/30 hover:bg-red-500/70 transition-colors duration-200 text-white"
                    onClick={(e) => handleDeleteClick(item.id, e)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )} */}

              {/* Title tooltip on hover */}
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
                      className="w-68 h-max max-h-128 overflow-auto p-2"
                      side="right"
                    >
                      <div className="space-y-2">
                        <div
                          onDoubleClick={handleEditTitle}
                          className="relative"
                        >
                          <Input
                            ref={inputRef}
                            value={item.asset_title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="disabled:opacity-100 pr-8"
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleSaveTitle()
                            }
                            disabled={!isEditingTitle}
                          />
                          <TooltipIconButton
                            tooltip={
                              isEditingTitle ? "Save Title" : "Edit Title"
                            }
                            variant="ghost"
                            className="h-8 w-8 absolute top-1/2 -translate-y-1/2 right-0 hover:bg-transparent resize-none min-h-max"
                            onClick={
                              isEditingTitle ? handleSaveTitle : handleEditTitle
                            }
                          >
                            {isEditingTitle ? (
                              <SaveIcon size={18} className="" />
                            ) : (
                              <EditIcon size={18} className="" />
                            )}
                          </TooltipIconButton>
                        </div>

                        {/* Image details with gray background */}
                        <div className="bg-[#F3F4F6] font-bold text-sm p-4 rounded-md">
                          <div className="space-y-1">
                            <p className="text-gray-800">
                              Size:{" "}
                              {`${item.dimensions?.width}x${item.dimensions?.height}`}
                            </p>
                            <p className="text-gray-800">
                              Format: {item.media_format}
                            </p>
                            <p className="text-gray-800">
                              Source: {item.asset_source}
                            </p>
                          </div>
                        </div>

                        {/* Comment section without border */}
                        <div
                          className="relative"
                          onDoubleClick={() => {
                            if (!isEditingComment) {
                              handleEditComment();
                            }
                          }}
                        >
                          <div className="relative">
                            <Textarea
                              disabled={!isEditingComment}
                              ref={textareaRef}
                              placeholder="Add comment"
                              value={itemComment}
                              onChange={handleCommentChange}
                              className="resize-none min-h-[100px] overflow-hidden disabled:opacity-100"
                              rows={3}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && e.ctrlKey) {
                                  handleSaveComment();
                                }
                              }}
                            />
                            {itemComment?.trim() !== "" && (
                              <TooltipIconButton
                                tooltip={
                                  isEditingComment
                                    ? "Save Comment"
                                    : "Edit Comment"
                                }
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 absolute top-1 right-1 hover:!bg-transparent"
                                onClick={
                                  isEditingComment
                                    ? handleSaveComment
                                    : handleEditComment
                                }
                              >
                                {isEditingComment ? (
                                  <SaveIcon size={18} className="" />
                                ) : (
                                  <EditIcon size={18} className="" />
                                )}
                              </TooltipIconButton>
                            )}
                          </div>

                          {/* )} */}
                        </div>

                        <Button
                          variant="ghost"
                          onClick={(e) => handleDownloadClick(item, e)}
                          className="w-full flex items-center justify-start hover:bg-gray-100 transition-colors cursor-pointer text-left p-2 rounded-md hover:text-foreground"
                        >
                          <DownloadIcon size={24} />
                          <span className="ml-1">Download</span>
                        </Button>

                        <Button
                          variant="ghost"
                          onClick={(e) => handleDeleteClick(item.id, e)}
                          className="w-full flex items-center justify-start hover:bg-gray-100 transition-colors cursor-pointer text-left p-2 rounded-md hover:text-foreground"
                        >
                          <DeleteIcon size={24} />
                          <span className="ml-1">Delete</span>
                        </Button>

                        <ReusableAlertDialog
                          open={showDeleteDialog}
                          onOpenChange={setShowDeleteDialog}
                          title="Delete Moodboard"
                          description="Are you sure you want to delete this moodboard? This action cannot be undone."
                          confirmLabel="Delete"
                          cancelLabel="Cancel"
                          onConfirm={handleDelete}
                          isLoading={isDeleting}
                          danger={true}
                        />
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
  );
}
