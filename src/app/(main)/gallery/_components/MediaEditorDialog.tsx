"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
import AskKittykatVersions from "./AskKittykatVersions";
import { useQueryClient } from "@tanstack/react-query";
import { useUndoRedoRemix } from "@/hooks/useUndoRedoRemix";
import { RemixImageHandle } from "../../_components/remix/RemixImage";

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
  const [currentItem, setCurrentItem] = useState<GalleryItemResponse | null>(
    item
  );
  // State for tabs, comments, replies, and attachments
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

  useEffect(() => {
    setCurrentItem(item);
  }, [item]);

  const queryClient = useQueryClient();

  const revalidateGalleryItemVersions = async (data: GalleryItemResponse) => {
    if (item!.id) {
      queryClient.setQueryData(["versions", item!.id], (oldData: any) => {
        if (!oldData) return oldData;

        return oldData.map((version: GalleryItemResponse) =>
          version.id === data.id ? data : version
        );
      });
    }
  };

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
      setCurrentItem(item);
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

  if (!currentItem) return null;

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
          file,
          item?.brand_id || null,
          item?.campaign_id || null
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
      galleryActions.addComment(
        {
          itemId: currentItem.id,
          commentData: {
            text: newComment,
            attachments: attachments.length > 0 ? attachments : undefined,
          },
        },
        {
          onSuccess(data) {
            revalidateGalleryItemVersions(data);
          },
        }
      );
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
      galleryActions.addReply(
        {
          itemId: currentItem.id,
          commentId: commentId,
          replyData: {
            text: replyText,
            attachments:
              replyAttachments.length > 0 ? replyAttachments : undefined,
          },
        },
        {
          onSuccess(data) {
            revalidateGalleryItemVersions(data);
          },
        }
      );
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
      galleryActions.patchComment(
        {
          itemId: currentItem.id,
          commentId,
          updateData: { text },
        },
        {
          onSuccess(data) {
            revalidateGalleryItemVersions(data);
          },
        }
      );

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
      galleryActions.patchReply(
        {
          itemId: currentItem.id,
          commentId,
          replyId,
          updateData: { text },
        },
        {
          onSuccess(data) {
            revalidateGalleryItemVersions(data);
          },
        }
      );

      setEditingReply(null);
      toast.success("Reply updated successfully");
    } catch (error) {
      toast.error("Failed to update reply");
      console.error(error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await galleryActions.deleteComment(
        {
          itemId: currentItem.id,
          commentId,
        },
        {
          onSuccess(data) {
            if (item!.id) {
              queryClient.setQueryData(
                ["versions", item!.id],
                (oldData: any) => {
                  if (!oldData) return oldData;

                  return oldData.map((version: GalleryItemResponse) => {
                    if (version.id === currentItem.id)
                      return {
                        ...version,
                        comments: version.comments?.filter(
                          (c: Comment) => c.id !== data.id
                        ),
                      };

                    return version;
                  });
                }
              );
            }
          },
        }
      );

      toast.success("Comment deleted successfully");
    } catch (error) {
      toast.error("Failed to delete comment");
      console.error(error);
    }
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    try {
      galleryActions.deleteReply(
        {
          itemId: currentItem.id,
          commentId,
          replyId,
        },
        {
          onSuccess(data) {
            revalidateGalleryItemVersions(data);
          },
        }
      );

      toast.success("Reply deleted successfully");
    } catch (error) {
      toast.error("Failed to delete reply");
      console.error(error);
    }
  };

  const handleLikeComment = (comment: Comment, itemId: string) => {
    const alreadyLiked = (comment?.likes ?? []).includes(user?.id ?? "");
    const likeAction = alreadyLiked ? "remove" : "add";

    // Backup current state in case rollback is needed
    const prevComments = currentItem?.comments || [];

    // Optimistically update the UI
    const updatedComments = prevComments.map((c) => {
      if (c.id !== comment.id) return c;

      const updatedLikes = alreadyLiked
        ? c.likes?.filter((id) => id !== user?.id)
        : [...(c.likes || []), user?.id ?? ""];

      return {
        ...c,
        likes: updatedLikes,
      };
    });

    setCurrentItem((prev) =>
      prev ? { ...prev, comments: updatedComments } : prev
    );

    // Send the request
    galleryActions.patchComment(
      {
        itemId,
        commentId: comment.id,
        updateData: {
          like_action: likeAction,
        },
      },
      {
        onSuccess(data) {
          revalidateGalleryItemVersions(data); // optional: may update entire item
        },
        onError() {
          // Rollback to previous comments if error
          setCurrentItem((prev) =>
            prev ? { ...prev, comments: prevComments } : prev
          );
          toast.error("Failed to update like. Please try again.");
        },
      }
    );
  };

  const handleLikeReply = (
    reply: CommentReply,
    itemId: string,
    commentId: string
  ) => {
    const alreadyLiked = (reply?.likes ?? []).includes(user?.id ?? "");
    const likeAction = alreadyLiked ? "remove" : "add";

    // Backup current state
    const prevComments = currentItem?.comments || [];

    // Optimistically update the UI
    const updatedComments = prevComments.map((comment) => {
      if (comment.id !== commentId) return comment;

      const updatedReplies = (comment.replies || []).map((r) => {
        if (r.id !== reply.id) return r;

        const updatedLikes = alreadyLiked
          ? r.likes?.filter((id) => id !== user?.id)
          : [...(r.likes || []), user?.id ?? ""];

        return {
          ...r,
          likes: updatedLikes,
        };
      });

      return {
        ...comment,
        replies: updatedReplies,
      };
    });

    setCurrentItem((prev) =>
      prev ? { ...prev, comments: updatedComments } : prev
    );

    // Send request
    galleryActions.patchReply(
      {
        itemId,
        commentId,
        replyId: reply.id,
        updateData: {
          like_action: likeAction,
        },
      },
      {
        onSuccess(data) {
          revalidateGalleryItemVersions(data);
        },
        onError() {
          // Rollback on error
          setCurrentItem((prev) =>
            prev ? { ...prev, comments: prevComments } : prev
          );
          toast.error("Failed to update reply like. Please try again.");
        },
      }
    );
  };

  const handleAskKittyKat = async () => {
    if (currentItem.sent_to_human_queue) {
      toast.info("This item is already in the human editing queue");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmAskKittyKat = async () => {
    try {
      galleryActions.patchItem(
        {
          itemId: currentItem.id,
          data: {
            sent_to_human_queue: true,
            workflow_status: "request_created",
          },
        },
        {
          onSuccess(data) {
            revalidateGalleryItemVersions(data);
          },
        }
      );
      setShowConfirmDialog(false);
      toast.success(
        "Request sent to KittyKat! Our team will review your request."
      );
    } catch (error) {
      toast.error("Failed to send request to KittyKat");
      console.error(error);
    }
  };

  const hasComments = currentItem.comments && currentItem.comments.length > 0;

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

  const [brushSize, setBrushSize] = useState(80);
  const isRemixEnabled = activeTab === "in-paint";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offScreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const remixImageRef = useRef<RemixImageHandle>(null);
  const remixHistory = useUndoRedoRemix();

  const handleBrushSizeChange = useCallback(
    (size: number) => {
      setBrushSize(size);
      if (remixImageRef.current && isRemixEnabled) {
        remixImageRef.current.setBrushSize?.(size); // Update canvas without callback loop
      }
    },
    [isRemixEnabled]
  );

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
          <DialogHeader className="px-6 py-4 mb-0 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-semibold">
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
            <div className="w-[35%] min-w-[280px] flex flex-col justify-between gap-y-4">
              <AskKittykatImageSection
                item={currentItem}
                galleryActions={galleryActions}
                isRemixEnabled={isRemixEnabled}
                imageRef={imageRef}
                canvasRef={canvasRef}
                offScreenCanvasRef={offScreenCanvasRef}
                remixHistory={remixHistory}
                brushSize={brushSize}
              />
              <AskKittykatVersions
                item={item!}
                currentVersion={currentItem}
                onVersionChange={(updatedItem) => {
                  setCurrentItem(updatedItem);
                }}
              />
            </div>

            {/* Right Panel */}
            <div className="flex-1 w-[65%] flex flex-col">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col bg-none"
              >
                {currentItem.asset_type !== "video" && (
                  <>
                    <AskKittykatTabs />
                    <AskKittykatImageEditingTools
                      item={currentItem}
                      remixControls={{
                        image: {
                          url: currentItem.asset_url,
                          size: currentItem.size || "original",
                        },
                        canUndo: remixHistory.canUndo,
                        canRedo: remixHistory.canRedo,
                        onUndo: () => remixImageRef.current?.undo?.(),
                        onRedo: () => remixImageRef.current?.redo?.(),
                        onClear: () => remixImageRef.current?.clearCanvas?.(),
                        offScreenCanvasRef,
                        brushSize,
                        onBrushSizeChange: handleBrushSizeChange,
                        closeDialog: () => onOpenChange(false),
                      }}
                    />
                  </>
                )}
                <TabsContent
                  value="ask-kittykat"
                  className="flex-1 flex flex-col"
                >
                  <div className="px-4 py-3">
                    <h2 className="font-semibold text-lg">Ask Kitty Kat</h2>
                  </div>

                  {/* Comments Section - Responsive Scrollable Area */}
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto min-h-0">
                    <div
                      className="space-y-4 overflow-y-auto"
                      style={{
                        maxHeight: "calc(100vh - 600px)", // Dynamic height calculation
                        minHeight: "200px", // Minimum height to ensure visibility
                      }}
                    >
                      {!hasComments ? (
                        <AskKittykatCommentGuidelines />
                      ) : (
                        <div className="space-y-4">
                          {currentItem.comments?.map((comment) => (
                            <div key={comment.id} className="space-y-3">
                              <AskKittykatCommentItem
                                comment={comment}
                                itemId={currentItem.id}
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
                                itemId={currentItem.id}
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
                  </div>

                  {/* Fixed Comment Input Section */}
                  <div className="border-t bg-white p-4 space-y-3 flex-shrink-0">
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

                  {/* Review Status Section - Always Visible */}
                  <div className="flex-shrink-0 ">
                    <AskKittykatReviewStatus
                      onAskKittykat={handleAskKittyKat}
                      galleryActions={galleryActions}
                      // ** IMPORTANT ** TO DECIDE: Should we pass the current item (versions) or the original item (Version 1) staus here?
                      item={currentItem}
                      revalidateGalleryItemVersions={
                        revalidateGalleryItemVersions
                      }
                      setCurrentItem={setCurrentItem}
                    />
                  </div>
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
