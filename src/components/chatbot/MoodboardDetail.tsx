"use client";

import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, handleDownloadImage } from "@/lib/utils";
import {
  deleteCampaignMoodboard,
  updateCampaignMoodboard,
} from "@/services/api/brand.service";
import { MoodboardAsset } from "@/types/types";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  LibraryIcon,
  SaveIcon,
} from "../ui/custom-icon";
import { Input } from "../ui/input";

interface MoodboardDetailProps {
  moodboard: MoodboardAsset;
  campaignId: string;
  brandId: string;
}

export default function MoodboardDetail({
  moodboard,
  brandId,
  campaignId,
}: MoodboardDetailProps) {
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(moodboard.asset_title);
  const [comment, setComment] = useState(moodboard.comment);

  // Focus input elements when editing starts
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
    }

    if (isEditingComment && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditingTitle, isEditingComment]);

  const handleEditTitle = () => {
    setIsEditingTitle(true);
  };

  const handleEditComment = () => {
    setIsEditingComment(true);
  };

  const handleSaveComment = async () => {
    updateCampaignMoodboard(brandId, campaignId, moodboard.id, {
      comment: comment,
    }).then(() => {
      setIsEditingComment(false);
    });
  };

  const handleSaveTitle = async () => {
    updateCampaignMoodboard(brandId, campaignId, moodboard.id, {
      title,
    }).then(() => {
      setIsEditingTitle(false);
    });
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);

    // Show save button when first character is typed
    if (!isEditingComment && e.target.value.trim().length > 0) {
      setIsEditingComment(true);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCampaignMoodboard(brandId, campaignId, moodboard.id);
      setShowDeleteDialog(false);
      toast.success("Moodboard deleted successfully", {
        position: "top-right",
      });
    } catch (error) {
      console.error("Error deleting moodboard:", error);
      toast.error(
        "Could not delete moodboard at the moment. Please try again.",
        {
          position: "top-right",
        }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddToLibrary = async () => {};

  const ACTION_BUTTONS = [
    {
      label: "Download",
      icon: DownloadIcon,
      onClick: () => {
        if (moodboard.asset_url) handleDownloadImage(moodboard.asset_url);
      },
    },
    {
      label: "Delete",
      icon: DeleteIcon,
      onClick: () => setShowDeleteDialog(true),
    },
    {
      label: "Add to Library",
      icon: LibraryIcon,
      onClick: handleAddToLibrary,
    },
  ];

  return (
    <div className="space-y-2">
      <div onDoubleClick={handleEditTitle} className="relative">
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="disabled:opacity-100"
          onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
          disabled={!isEditingTitle}
        />
        <Button
          variant="ghost"
          className="h-8 w-8 absolute top-1/2 -translate-y-1/2 right-0 hover:bg-transparent resize-none h-max min-h-max"
          onClick={isEditingTitle ? handleSaveTitle : handleEditTitle}
        >
          {isEditingTitle ? (
            <SaveIcon size={18} className="" />
          ) : (
            <EditIcon size={18} className="" />
          )}
        </Button>
      </div>

      {/* Image details with gray background */}
      <div className="bg-[#F3F4F6] font-bold text-sm p-4 rounded-md">
        <div className="space-y-1">
          <p className="text-gray-800">
            Size:{" "}
            {`${moodboard.dimensions.width}x${moodboard.dimensions.height}`}
          </p>
          <p className="text-gray-800">Format: {moodboard.media_format}</p>
          <p className="text-gray-800">Source: {moodboard.source}</p>
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
            value={comment || ""}
            onChange={handleCommentChange}
            className="resize-none min-h-[100px] overflow-hidden disabled:opacity-100"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                handleSaveComment();
              }
            }}
          />
          {comment?.trim() !== "" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 absolute top-1 right-1 hover:!bg-transparent"
              onClick={isEditingComment ? handleSaveComment : handleEditComment}
            >
              {isEditingComment ? (
                <SaveIcon size={18} className="" />
              ) : (
                <EditIcon size={18} className="" />
              )}
            </Button>
          )}
        </div>
        {/* )} */}
      </div>

      {/* Action buttons without border */}
      <div>
        {ACTION_BUTTONS.map((button) => (
          <Button
            key={button.label}
            variant="ghost"
            className={cn(
              "w-full justify-start hover:bg-gray-100 transition-colors cursor-pointer hover:!text-foreground"
            )}
            onClick={button.onClick}
          >
            <button.icon size={24} />
            <span className="ml-1">{button.label}</span>
          </Button>
        ))}
      </div>

      {/* Delete confirmation dialog */}
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
  );
}
