// Comment Section Component

import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { DeleteIcon, EditIcon, SaveIcon } from "@/components/ui/custom-icon";
import { Textarea } from "@/components/ui/textarea";
import { GalleryItemResponse } from "@/types/gallery.types";
import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MediaItemCommentSectionProps {
  item: GalleryItemResponse;
  onUpdateComment: (
    itemId: string,
    commentId: string,
    text: string
  ) => Promise<void>;
  onDeleteComment: (itemId: string, commentId: string) => Promise<void>;
  onAddComment: (
    itemId: string,
    text: string,
    attachments: string[] | undefined
  ) => Promise<void>;
}

export function MediaItemCommentSection({
  item,
  onUpdateComment,
  onDeleteComment,
  onAddComment,
}: MediaItemCommentSectionProps) {
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [comment, setComment] = useState(item.comments?.[0]?.text || "");
  const [newComment, setNewComment] = useState("");
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [isAddingCommentLoading, setIsAddingCommentLoading] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const newCommentRef = useRef<HTMLTextAreaElement | null>(null);

  const hasComment = comment.trim() !== "";

  useEffect(() => {
    if (isEditingComment && textareaRef.current) {
      textareaRef.current.focus();
    }
    if (isAddingComment && newCommentRef.current) {
      newCommentRef.current.focus();
    }
  }, [isEditingComment, isAddingComment]);

  const handleEditComment = () => setIsEditingComment(true);

  const handleSaveComment = async () => {
    if (isSavingComment) return;

    const commentId = item.comments?.[0]?.id;
    if (!commentId) return;

    setIsSavingComment(true);
    try {
      await onUpdateComment(item.id, commentId, comment);
      setIsEditingComment(false);
    } catch (error) {
      console.error("Error saving comment:", error);
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleDeleteComment = async () => {
    if (isDeletingComment) return;

    const commentId = item.comments?.[0]?.id;
    if (!commentId) return;

    setIsDeletingComment(true);
    try {
      await onDeleteComment(item.id, commentId);
      setComment("");
      setIsEditingComment(false);
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setIsDeletingComment(false);
    }
  };

  const handleCancelCommentEdit = () => {
    setIsEditingComment(false);
    setComment(item.comments?.[0]?.text || "");
  };

  const handleAddNewComment = async () => {
    if (isAddingCommentLoading || !newComment.trim()) return;

    setIsAddingCommentLoading(true);
    try {
      await onAddComment(item.id, newComment, undefined);
      setIsAddingComment(false);
      setNewComment("");
      setComment(newComment);
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsAddingCommentLoading(false);
    }
  };

  const handleStartAddingComment = () => setIsAddingComment(true);

  const handleCancelAddingComment = () => {
    setIsAddingComment(false);
    setNewComment("");
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSaveComment();
    } else if (e.key === "Escape") {
      handleCancelCommentEdit();
    }
  };

  const handleNewCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleAddNewComment();
    } else if (e.key === "Escape") {
      handleCancelAddingComment();
    }
  };

  return (
    <div className="space-y-2">
      {/* Existing comment display/edit */}
      {hasComment && (
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
              disabled={!isEditingComment || isSavingComment}
              ref={textareaRef}
              placeholder="Add comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none min-h-[80px] overflow-hidden disabled:opacity-100 pr-20"
              rows={3}
              onKeyDown={handleCommentKeyDown}
            />

            {/* Comment action buttons */}
            <div className="absolute top-1 right-1 flex gap-1">
              {!isEditingComment && (
                <TooltipIconButton
                  tooltip="Delete Comment"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:!bg-red-100 hover:!text-red-600"
                  onClick={handleDeleteComment}
                  disabled={isDeletingComment}
                >
                  {isDeletingComment ? (
                    <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-red-600 rounded-full" />
                  ) : (
                    <DeleteIcon size={16} />
                  )}
                </TooltipIconButton>
              )}

              <TooltipIconButton
                tooltip={isEditingComment ? "Save Comment" : "Edit Comment"}
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:!bg-transparent"
                onClick={() =>
                  isEditingComment ? handleSaveComment() : handleEditComment()
                }
                disabled={isSavingComment}
              >
                {isSavingComment ? (
                  <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                ) : isEditingComment ? (
                  <SaveIcon size={18} />
                ) : (
                  <EditIcon size={18} />
                )}
              </TooltipIconButton>
            </div>
          </div>
        </div>
      )}

      {/* Add new comment section */}
      {!hasComment && !isAddingComment && (
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

      {!hasComment && isAddingComment && (
        <div className="relative">
          <Textarea
            ref={newCommentRef}
            placeholder="Write your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="resize-none min-h-[80px] pr-20"
            rows={3}
            onKeyDown={handleNewCommentKeyDown}
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
              disabled={isAddingCommentLoading || !newComment.trim()}
            >
              {isAddingCommentLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-green-600 rounded-full" />
              ) : (
                <SaveIcon size={16} />
              )}
            </TooltipIconButton>
          </div>
        </div>
      )}
    </div>
  );
}
