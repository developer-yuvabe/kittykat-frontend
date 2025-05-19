"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Pencil, Download, Trash2, BookOpen, Save } from "lucide-react";
import { toast } from "sonner";
import { useThreads } from "@/providers/langgraph/Thread";
import { useQueryState } from "nuqs";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { handleDownloadImage } from "@/lib/utils";

interface MoodboardDetailProps {
  campaignId: string;
  size?: string;
  format?: string;
  source?: string;
  imageUrl?: string;
  prompt?: string;
}

const defaultSize = "1024 x 768";
const defaultFormat = "Jpeg";
const defaultSource = "Moodboard Generator";

export default function MoodboardDetail({
  campaignId,
  size = defaultSize,
  format = defaultFormat,
  source = defaultSource,
  imageUrl,
  prompt,
}: MoodboardDetailProps) {
  const { updateThreadCampaign, getThreadCampaignById } = useThreads();
  const [threadId] = useQueryState("threadId");
  const [comment, setComment] = useState("");
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState("Moodboard_13_May_4...");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentContainerRef = useRef<HTMLDivElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);

  // Load existing data when component mounts
  useEffect(() => {
    if (threadId) {
      const campaignData = getThreadCampaignById(threadId, campaignId);
      if (campaignData) {
        if (campaignData.title) setTitle(campaignData.title);
        if (campaignData.comment) setComment(campaignData.comment);
      }
    }
  }, [threadId, campaignId, getThreadCampaignById]);

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
    if (threadId) {
      if (comment.trim() !== "") {
        setIsEditingComment(false);
        const campaignData = {
          ...getThreadCampaignById(threadId, campaignId),
          title,
          comment,
          size,
          format,
          source,
          imageUrl,
          prompt,
        };

        toast.promise(
          async () => {
            await updateThreadCampaign(threadId, campaignId, campaignData);
            return true;
          },
          {
            loading: "Saving comment...",
            success: "Comment saved successfully",
            error: "Failed to save comment",
          }
        );
      }
    }
  };

  const handleSaveTitle = async () => {
    if (title.trim() !== "" && threadId) {
      setIsEditingTitle(false);
      const campaignData = {
        ...getThreadCampaignById(threadId, campaignId),
        title,
        comment,
        size,
        format,
        source,
        imageUrl,
        prompt,
      };

      toast.promise(
        async () => {
          await updateThreadCampaign(threadId, campaignId, campaignData);
          return true;
        },
        {
          loading: "Saving title...",
          success: "Title saved successfully",
          error: "Failed to save title",
        }
      );
    }
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
      if (threadId) {
        await toast.promise(
          async () => {
            // Simulate API call with a delay
            await new Promise((resolve) => setTimeout(resolve, 800));
            await updateThreadCampaign(threadId, campaignId, null);
            return true;
          },
          {
            loading: "Deleting moodboard...",
            success: "Moodboard deleted successfully",
            error: "Failed to delete moodboard",
          }
        );
      }
      // Additional UI updates after successful deletion could go here
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleAddToLibrary = () => {
    toast.promise(
      async () => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));
        return true;
      },
      {
        loading: "Adding to library...",
        success: "Added to library successfully",
        error: "Failed to add to library",
      }
    );
  };

  return (
    <div>
      {/* Header with title and edit button */}
      <div
        className="p-0 border-b relative"
        ref={titleContainerRef}
        onDoubleClick={handleEditTitle}
      >
        {isEditingTitle ? (
          <div className="relative pr-8">
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
              className="h-8 w-8 absolute top-1 right-0"
              onClick={handleSaveTitle}
            >
              <Save size={18} className="" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium cursor-pointer">{title}</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleEditTitle}
            >
              <Pencil size={18} className="text-gray-500" />
            </Button>
          </div>
        )}
      </div>

      {/* Image display if available */}
      {imageUrl && (
        <div className="my-4">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            className="w-full h-auto rounded-md shadow-sm"
          />
        </div>
      )}

      {/* Image details with gray background */}
      <div className="bg-gray-50 font-bold text-sm p-4 rounded-md my-2">
        <div className="space-y-1">
          <p className="text-gray-800">Size: {size}</p>
          <p className="text-gray-800">Format: {format}</p>
          <p className="text-gray-800">Source: {source}</p>
        </div>
      </div>

      {/* Comment section without border */}
      <div
        className="py-4 relative"
        ref={commentContainerRef}
        onDoubleClick={() => {
          if (!isEditingComment) {
            handleEditComment();
          }
        }}
      >
        {comment && !isEditingComment ? (
          <div className="flex items-start justify-between">
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
              value={comment}
              onChange={handleCommentChange}
              className="resize-none min-h-[100px] overflow-hidden"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  handleSaveComment();
                }
              }}
            />
            {comment.trim() !== "" && (
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
        {!comment && !isEditingComment && (
          <div
            className="text-gray-400 cursor-pointer"
            onClick={handleEditComment}
          >
            Add a comment...
          </div>
        )}
      </div>

      {/* Action buttons without border */}
      <div className="space-y-1 mt-2">
        <Button
          variant="ghost"
          className="w-full h-10 justify-start pl-2 hover:bg-gray-100 transition-colors"
          onClick={() => {
            if (imageUrl) handleDownloadImage(imageUrl);
          }}
          disabled={!imageUrl}
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
