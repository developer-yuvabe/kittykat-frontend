"use client";

import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { handleDownloadImage } from "@/lib/utils";
import {
  deleteCampaignMoodboard,
  updateCampaignMoodboard,
} from "@/services/api/brand.service";
import { MoodboardAsset } from "@/types/types";
import { BookOpen, Download, Pencil, Save, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
      inputRef.current.select();
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

  return (
    <div>
      {/* Header with title and edit button */}
      <div
        className="p-0 border-b relative pb-2"
        onDoubleClick={handleEditTitle}
      >
        {isEditingTitle ? (
          <div className="relative pr-8 gap-x-2">
            <Input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="pr-8"
              onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 absolute top-1 right-0 hover:bg-transparent"
              onClick={handleSaveTitle}
            >
              <Save size={18} className="" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-2">
            <h2 className="cursor-pointer">{title}</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-transparent"
              onClick={handleEditTitle}
            >
              <Pencil size={18} className="text-gray-500" />
            </Button>
          </div>
        )}
      </div>

      {/* Image details with gray background */}
      <div className="bg-gray-50 font-bold text-sm p-4 rounded-md my-2">
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
        className="py-4 relative"
        onDoubleClick={() => {
          if (!isEditingComment) {
            handleEditComment();
          }
        }}
      >
        {comment && !isEditingComment ? (
          <div className="flex items-center justify-between px-2">
            <p className="text-gray-700 pr-8 cursor-pointer">{comment}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 absolute top-2 right-2"
              onClick={handleEditComment}
            >
              <Pencil size={18} className="text-gray-500" />
            </Button>
          </div>
        ) : (
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Add comment"
              value={comment || ""}
              onChange={handleCommentChange}
              className="resize-none min-h-[100px] overflow-hidden"
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
                className="h-8 w-8 absolute top-2 right-2"
                onClick={handleSaveComment}
              >
                <Save size={18} className="" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Action buttons without border */}
      <div className="space-y-1 mt-2">
        <Button
          variant="ghost"
          className="w-full h-10 justify-start pl-2 hover:bg-gray-100 transition-colors"
          onClick={() => {
            if (moodboard.asset_url) handleDownloadImage(moodboard.asset_url);
          }}
          disabled={!moodboard.asset_url}
        >
          <Download className="h-5 w-5" />
          <span className="ml-2">Download</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full h-10 justify-start pl-2 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-5 w-5" />
          <span className="ml-2">Delete</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full h-10 justify-start pl-2 hover:bg-gray-100 transition-colors"
          onClick={handleAddToLibrary}
        >
          <BookOpen className="h-5 w-5" />
          <span className="ml-2">Add to Library</span>
        </Button>
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
