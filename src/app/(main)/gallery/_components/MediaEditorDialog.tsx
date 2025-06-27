"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { X, Paperclip, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import type {
  GalleryItemResponse,
  Comment,
  CommentReply,
} from "@/types/gallery.types";
import { AskKittykatImageSection } from "./AskKittykatImageSection";
import { AskKittykatCommentGuidelines } from "./AskKittykatCommentGuidelines";
import { AskKittykatTabs } from "./AskKittykatTabs";
import { GalleryActions } from "@/hooks/useGallery";
import { AskKittyKatConfirmationDialog } from "./AskKittyKatConfirmationDialog";
import { AskKittykatImageEditingTools } from "./AskKittykatImageEditingTools";
import { useUserStore } from "@/store/user.store";
import { AskKittykatReviewStatus } from "./AskKittykatReviewStatus";
import { AskKittykatCommentItem } from "./AskKittykatCommentItem";
import { AskKittykatReplyList } from "./AskKittykatReplyList";
import { AskKittykatReplyInput } from "./AskKittykatReplyInput";
import ZoomableImage from "@/components/ui/zoomable-image";

interface MediaEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GalleryItemResponse | null;
  galleryActions: GalleryActions;
  // New props for carousel functionality
  currentIndex?: number;
  onNavigate?: (direction: "next" | "prev") => void;
  totalItems?: number;
}

export function MediaEditorDialog({
  open,
  onOpenChange,
  item,
  galleryActions,
  currentIndex = 0,
  onNavigate,
  totalItems = 0,
}: MediaEditorDialogProps) {
  const [activeTab, setActiveTab] = useState("ask-kittykat");
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<{
    commentId: string;
    replyId: string;
  } | null>(null);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [replyAttachments, setReplyAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUserStore();

  // Reset form states when item changes
  useEffect(() => {
    if (item) {
      setNewComment("");
      setReplyingTo(null);
      setReplyText("");
      setEditingComment(null);
      setEditingReply(null);
      setAttachments([]);
      setReplyAttachments([]);
      setActiveTab("ask-kittykat");
    }
  }, [item?.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open || !onNavigate) return;

      if (event.key === "ArrowLeft" && currentIndex > 0) {
        event.preventDefault();
        onNavigate("prev");
      } else if (event.key === "ArrowRight" && currentIndex < totalItems - 1) {
        event.preventDefault();
        onNavigate("next");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, currentIndex, totalItems, onNavigate]);

  if (!item) return null;

  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex < totalItems - 1;

  const handleNavigate = (direction: "next" | "prev") => {
    if (onNavigate) {
      onNavigate(direction);
    }
  };

  const handleFileUpload = async (files: FileList | null, isReply = false) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);

    // Show loading toast and store the toast ID
    const toastId = toast.loading("Uploading files...");

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileName = `comment-attachment-${Date.now()}-${file.name}`;
        return await uploadFileAndReturnUrl(
          fileName,
          file.type,
          "ask-kittykat",
          file
        );
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      if (isReply) {
        setReplyAttachments((prev) => [...prev, ...uploadedUrls]);
      } else {
        setAttachments((prev) => [...prev, ...uploadedUrls]);
      }

      toast.success(`${files.length} file(s) uploaded successfully`, {
        id: toastId,
      });
    } catch (error) {
      toast.error("Failed to upload files", { id: toastId });
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };
  const handleSubmitComment = async () => {
    if (!newComment.trim() && attachments.length === 0) return;

    setIsSubmitting(true);
    try {
      galleryActions.addComment({
        itemId: item.id,
        commentData: {
          text: newComment,
          attachments: attachments.length > 0 ? attachments : undefined,
        },
      });
      setNewComment("");
      setAttachments([]);
      toast.success("Comment added successfully");
    } catch (error) {
      toast.error("Failed to add comment");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!replyText.trim() && replyAttachments.length === 0) return;

    setIsSubmitting(true);
    try {
      galleryActions.addReply({
        itemId: item.id,
        commentId: commentId,
        replyData: {
          text: replyText,
          attachments:
            replyAttachments.length > 0 ? replyAttachments : undefined,
        },
      });
      setReplyText("");
      setReplyingTo(null);
      setReplyAttachments([]);
      toast.success("Reply added successfully");
    } catch (error) {
      toast.error("Failed to add reply");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string, text: string) => {
    try {
      galleryActions.patchComment({
        itemId: item.id,
        commentId,
        updateData: { text },
      });
      setEditingComment(null);
      toast.success("Comment updated successfully");
    } catch (error) {
      toast.error("Failed to update comment");
      console.error(error);
    }
  };

  const handleUpdateReply = async (
    commentId: string,
    replyId: string,
    text: string
  ) => {
    try {
      galleryActions.patchReply({
        itemId: item.id,
        commentId,
        replyId,
        updateData: { text },
      });
      setEditingReply(null);
      toast.success("Reply updated successfully");
    } catch (error) {
      toast.error("Failed to update reply");
      console.error(error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await galleryActions.deleteComment({
        itemId: item.id,
        commentId,
      });
      toast.success("Comment deleted successfully");
    } catch (error) {
      toast.error("Failed to delete comment");
      console.error(error);
    }
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!confirm("Are you sure you want to delete this reply?")) return;

    try {
      galleryActions.deleteReply({
        itemId: item.id,
        commentId,
        replyId,
      });
      toast.success("Reply deleted successfully");
    } catch (error) {
      toast.error("Failed to delete reply");
      console.error(error);
    }
  };

  const handleLikeComment = (comment: Comment, itemId: string) => {
    const alreadyLiked = (comment?.likes ?? []).includes(user?.id ?? "");
    console.log(comment);

    galleryActions.patchComment({
      itemId,
      commentId: comment.id,
      updateData: {
        like_action: alreadyLiked ? "remove" : "add",
      },
    });
  };

  const handleLikeReply = (
    reply: CommentReply,
    itemId: string,
    commentId: string
  ) => {
    const alreadyLiked = (reply?.likes ?? []).includes(user?.id ?? "");

    galleryActions.patchReply({
      itemId,
      commentId,
      replyId: reply.id,
      updateData: {
        like_action: alreadyLiked ? "remove" : "add",
      },
    });
  };

  const handleAskKittyKat = async () => {
    if (item.sent_to_human_queue) {
      toast.info("This item is already in the human editing queue");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmAskKittyKat = async () => {
    try {
      galleryActions.patchItem({
        itemId: item.id,
        data: { sent_to_human_queue: true },
      });
      setShowConfirmDialog(false);
      toast.success(
        "Request sent to KittyKat! Our team will review your request."
      );
    } catch (error) {
      toast.error("Failed to send request to KittyKat");
      console.error(error);
    }
  };

  const hasComments = item.comments && item.comments.length > 0;

  useEffect(() => {
    const prefetchThreshold = 2; // start prefetching 2 items before the end of loaded items
    const loadedItemsCount = galleryActions.galleryItems.length;

    if (
      loadedItemsCount - currentIndex <= prefetchThreshold &&
      galleryActions.hasNextPage &&
      !galleryActions.isFetchingNextPage
    ) {
      galleryActions.fetchNextPage();
    }
  }, [
    currentIndex,
    galleryActions.galleryItems.length,
    galleryActions.hasNextPage,
    galleryActions.isFetchingNextPage,
  ]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          onInteractOutside={(e) => {
            if (showConfirmDialog) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (showConfirmDialog) e.preventDefault();
          }}
          className="p-4 h-[100dvh] w-[100dvw] max-w-[100dvw]! min-w-full rounded-none shadow-xl overflow-hidden flex flex-col justify-between"
        >
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">
                A2i Image Editor
              </DialogTitle>

              {/* Carousel Navigation Controls */}
              {onNavigate && totalItems > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {currentIndex + 1} of {galleryActions.totalItems}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNavigate("prev")}
                      disabled={!canNavigatePrev}
                      className="p-2 h-8 w-8"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNavigate("next")}
                      disabled={!canNavigateNext}
                      className="p-2 h-8 w-8"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden gap-x-3">
            <AskKittykatImageSection
              item={item}
              onAddVersion={() => {
                // handle add version
              }}
            />

            {/* Right Panel */}
            <div className="w-full flex-1 flex flex-col">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col bg-none"
              >
                <AskKittykatTabs />
                <AskKittykatImageEditingTools />

                <TabsContent
                  value="ask-kittykat"
                  className="flex-1 flex flex-col"
                >
                  <div className="px-4 py-3 border-b">
                    <h2 className="font-semibold text-lg">Ask Kitty Kat</h2>
                  </div>

                  {/* Comments Section - Scrollable */}
                  <div className="flex-1 p-4 space-y-4 overflow-y-scroll max-h-[35vh] xl:max-h-[45vh]">
                    {!hasComments ? (
                      <AskKittykatCommentGuidelines />
                    ) : (
                      <div className="space-y-4  ">
                        {item.comments?.map((comment) => (
                          <div key={comment.id} className="space-y-3">
                            <AskKittykatCommentItem
                              comment={comment}
                              itemId={item.id}
                              editingCommentId={editingComment}
                              setEditingComment={setEditingComment}
                              setReplyingTo={setReplyingTo}
                              onUpdateComment={handleUpdateComment}
                              onDeleteComment={handleDeleteComment}
                              onLikeComment={handleLikeComment}
                            />

                            <AskKittykatReplyList
                              replies={comment.replies}
                              commentId={comment.id}
                              itemId={item.id}
                              editingReply={editingReply}
                              setEditingReply={setEditingReply}
                              onUpdateReply={handleUpdateReply}
                              onDeleteReply={handleDeleteReply}
                              onLikeReply={handleLikeReply}
                            />

                            {/* Reply Form */}
                            {replyingTo === comment.id && (
                              <AskKittykatReplyInput
                                replyText={replyText}
                                setReplyText={setReplyText}
                                replyAttachments={replyAttachments}
                                setReplyAttachments={setReplyAttachments}
                                isSubmitting={isSubmitting}
                                isUploading={isUploading}
                                onSubmit={() => handleSubmitReply(comment.id)}
                                onCancel={() => {
                                  setReplyingTo(null);
                                  setReplyText("");
                                  setReplyAttachments([]);
                                }}
                                onFileUpload={handleFileUpload}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fixed Comment Input Section */}
                  <div className="border-t bg-white p-4 space-y-3">
                    <div className="space-y-3">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ask KittyKat for help with editing this image..."
                        className="min-h-[80px] resize-none"
                      />

                      {/* Attachments Preview */}
                      {attachments.length > 0 && (
                        <div className="flex flex-row gap-x-2">
                          {attachments.map((url, idx) => (
                            <div key={idx} className="relative">
                              <ZoomableImage
                                src={url}
                                key={idx}
                                className="w-16 h-16 object-cover rounded border cursor-pointer"
                              />
                              <Button
                                size="sm"
                                variant="destructive"
                                className="absolute -top-2 -right-2 w-5 h-5 p-0"
                                onClick={() =>
                                  setAttachments((prev) =>
                                    prev.filter((_, i) => i !== idx)
                                  )
                                }
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e.target.files)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            <Paperclip className="w-4 h-4" />
                          </Button>
                        </div>

                        <Button
                          onClick={handleSubmitComment}
                          disabled={
                            isSubmitting ||
                            (!newComment.trim() && attachments.length === 0)
                          }
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Add comment
                        </Button>
                      </div>
                    </div>
                  </div>

                  <AskKittykatReviewStatus
                    sentToHumanQueue={item?.sent_to_human_queue}
                    onAskKittykat={handleAskKittyKat}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AskKittyKatConfirmationDialog
        open={showConfirmDialog}
        setOpen={setShowConfirmDialog}
        onConfirm={handleConfirmAskKittyKat}
      />
    </>
  );
}
