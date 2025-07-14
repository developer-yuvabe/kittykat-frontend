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
import type { GalleryActions } from "@/hooks/useGallery";
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
import type { RemixImageHandle } from "../../_components/remix/RemixImage";

interface MediaEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GalleryItemResponse | null;
  galleryActions: GalleryActions;
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

  const [brushSize, setBrushSize] = useState(80);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offScreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const remixImageRef = useRef<RemixImageHandle>(null);
  const remixHistory = useUndoRedoRemix();

  const isRemixEnabled = activeTab === "in-paint";

  useEffect(() => {
    setCurrentItem(item);
  }, [item]);

  const queryClient = useQueryClient();

  const revalidateGalleryItemVersions = async (data: GalleryItemResponse) => {
    if (item?.id) {
      queryClient.setQueryData(["versions", item.id], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((version: GalleryItemResponse) =>
          version.id === data.id ? data : version
        );
      });
    }
  };

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
      setBrushSize(80);
    }
  }, [item]);

  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex < totalItems - 1;

  const handleNavigate = (direction: "next" | "prev") => {
    if (onNavigate) {
      onNavigate(direction);
    }
  };

  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size);
    if (remixImageRef.current?.setBrushSize && isRemixEnabled) {
      remixImageRef.current.setBrushSize(size);
    }
  };

  const handleUndo = () => {
    if (remixImageRef.current?.undo) {
      remixImageRef.current.undo();
    }
  };

  const handleRedo = () => {
    if (remixImageRef.current?.redo) {
      remixImageRef.current.redo();
    }
  };

  const handleClear = () => {
    if (remixImageRef.current?.clearCanvas) {
      remixImageRef.current.clearCanvas();
    }
  };

  const handleFileUpload = async (files: FileList | null, isReply = false) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
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
      if (!currentItem?.id) {
        setIsSubmitting(false);
        return;
      }
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
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!replyText.trim() && replyAttachments.length === 0) return;
    setIsSubmitting(true);

    try {
      if (!currentItem?.id) {
        setIsSubmitting(false);
        return;
      }
      galleryActions.addReply(
        {
          itemId: currentItem?.id,
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
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string, text: string) => {
    try {
      if (!currentItem?.id) {
        setIsSubmitting(false);
        return;
      }
      galleryActions.patchComment(
        {
          itemId: currentItem?.id,
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
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateReply = async (
    commentId: string,
    replyId: string,
    text: string
  ) => {
    try {
      if (!currentItem?.id) {
        setIsSubmitting(false);
        return;
      }
      galleryActions.patchReply(
        {
          itemId: currentItem?.id,
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
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      if (!currentItem?.id) {
        setIsSubmitting(false);
        return;
      }
      await galleryActions.deleteComment(
        {
          itemId: currentItem?.id,
          commentId,
        },
        {
          onSuccess(data) {
            if (item?.id) {
              queryClient.setQueryData(
                ["versions", item.id],
                (oldData: any) => {
                  if (!oldData) return oldData;
                  return oldData.map((version: GalleryItemResponse) => {
                    if (version.id === currentItem?.id)
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
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    try {
      if (!currentItem?.id) {
        setIsSubmitting(false);
        return;
      }
      galleryActions.deleteReply(
        {
          itemId: currentItem?.id,
          commentId,
          replyId,
        },
        {
          onSuccess(data) {
            revalidateGalleryItemVersions(data);
          },
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleLikeComment = (comment: Comment, itemId: string) => {
    const alreadyLiked = (comment?.likes ?? []).includes(user?.id ?? "");
    const likeAction = alreadyLiked ? "remove" : "add";
    const prevComments = currentItem?.comments || [];

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
          revalidateGalleryItemVersions(data);
        },
        onError() {
          setCurrentItem((prev) =>
            prev ? { ...prev, comments: prevComments } : prev
          );
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
    const prevComments = currentItem?.comments || [];

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
        onError: () => {
          setCurrentItem((prev) =>
            prev ? { ...prev, comments: prevComments } : prev
          );
        },
      }
    );
  };

  const handleAskKittyKat = async () => {
    if (currentItem?.sent_to_human_queue) {
      toast.info("This item is already in the human editing queue");
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmAskKittyKat = async () => {
    try {
      if (!currentItem?.id) {
        setIsSubmitting(false);
        return;
      }
      galleryActions.patchItem(
        {
          itemId: currentItem?.id,
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

  const hasComments = currentItem?.comments && currentItem.comments.length > 0;

  useEffect(() => {
    const prefetchThreshold = 2;
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
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="p-4 h-[100dvh] w-[100dvw] max-w-[100dvw]! min-w-full rounded-none shadow-xl overflow-hidden flex flex-col justify-between"
        >
          <DialogHeader className="px-6 py-4 mb-0 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-semibold">
                A2i Image Editor
              </DialogTitle>
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
              {currentItem && (
                <AskKittykatImageSection
                  item={currentItem}
                  galleryActions={galleryActions}
                  isRemixEnabled={isRemixEnabled}
                  imageRef={imageRef}
                  canvasRef={canvasRef}
                  offScreenCanvasRef={offScreenCanvasRef}
                  remixHistory={remixHistory}
                  brushSize={brushSize}
                  remixImageRef={remixImageRef}
                  revalidateGalleryItemVersions={revalidateGalleryItemVersions}
                />
              )}
              {currentItem && (
                <AskKittykatVersions
                  item={item!}
                  currentVersion={currentItem}
                  onVersionChange={(updatedItem) => {
                    setCurrentItem(updatedItem);
                  }}
                />
              )}
            </div>

            {/* Right Panel */}
            <div className="flex-1 w-[65%] flex flex-col">
              {currentItem && (
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
                          onUndo: handleUndo,
                          onRedo: handleRedo,
                          onClear: handleClear,
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

                    {/* Comments Section */}
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto min-h-0">
                      <div
                        className="space-y-4 overflow-y-auto"
                        style={{
                          maxHeight: "calc(100vh - 600px)",
                          minHeight: "200px",
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
                                {replyingTo === comment.id && (
                                  <AskKittykatReplyInput
                                    replyText={replyText}
                                    setReplyText={setReplyText}
                                    replyAttachments={replyAttachments}
                                    setReplyAttachments={setReplyAttachments}
                                    isSubmitting={isSubmitting}
                                    isUploading={isUploading}
                                    onSubmit={() =>
                                      handleSubmitReply(comment.id)
                                    }
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
                        item={item!}
                        revalidateGalleryItemVersions={
                          revalidateGalleryItemVersions
                        }
                        setCurrentItem={setCurrentItem}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              )}
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
