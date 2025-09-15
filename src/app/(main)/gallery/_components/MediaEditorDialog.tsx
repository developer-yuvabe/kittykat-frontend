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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUndoRedoRemix } from "@/hooks/useUndoRedoRemix";
import type { RemixImageHandle } from "../../_components/remix/RemixImage";
import VideoGenerationInput from "@/components/chatbot/a2i/features/VideoGenerationInput";
import { useModelsStore } from "@/store/models.store";
import VideoGeneration from "@/components/chatbot/a2i/features/VideoGeneration";
import { galleryService } from "@/services/api/gallery.service";

interface MediaEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GalleryItemResponse | null;
  galleryActions: GalleryActions;
  currentIndex?: number;
  onNavigate?: (direction: "next" | "prev") => void;
  totalItems?: number;
  campaignId?: string | null;
}

export function MediaEditorDialog({
  open,
  onOpenChange,
  item,
  galleryActions,
  currentIndex = 0,
  onNavigate,
  totalItems = 0,
  campaignId,
}: MediaEditorDialogProps) {
  const [currentItem, setCurrentItem] = useState<GalleryItemResponse | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("ask-kittykat");
  const { selectedRemixModel } = useModelsStore();
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
  const versionsRef = useRef<HTMLDivElement>(null);
  const { user } = useUserStore();

  const [brushSize, setBrushSize] = useState(50);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offScreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const remixImageRef = useRef<RemixImageHandle>(null);
  const remixHistory = useUndoRedoRemix();

  const isRemixEnabled =
    activeTab === "in-paint" &&
    !!selectedRemixModel &&
    selectedRemixModel.provider === "openai";

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
      setCurrentItem(null);
      setBrushSize(50);
    }
  }, [item?.id]);

  const versions = useQuery({
    queryKey: ["versions", item?.id],
    queryFn: () => galleryService.getGalleryItemVersions(item!.id),
    enabled: !!item?.id,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!item) {
      setCurrentItem(null);
      return;
    }

    setCurrentItem((prev) => {
      if (!prev) return item;

      return {
        ...item,

        comments: item.comments,
      };
    });
  }, [item]);

  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex < totalItems - 1;

  const campaign_id = campaignId || null;

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

  const handleSubmitComment = async (isTasklist = false) => {
    if (!newComment.trim() && attachments.length === 0) return;
    if (!currentItem?.id || !user?.id) {
      toast.error("Please log in to add a comment");
      return;
    }

    setIsSubmitting(true);

    // Create a temporary comment for optimistic update
    const tempCommentId = `temp-${Date.now()}`;
    const optimisticComment: Comment = {
      id: tempCommentId,
      text: newComment,
      added_by: user.id,
      added_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
      replies: [],
      likes: [],
      added_by_name: user.name,
      added_by_role: user.role.name, // From UserRole.name
    };

    // Optimistically update the UI
    setCurrentItem((prev) =>
      prev
        ? {
            ...prev,
            comments: [...(prev.comments || []), optimisticComment],
          }
        : prev
    );

    // Clear input fields immediately
    setNewComment("");
    setAttachments([]);

    try {
      await galleryActions.addComment(
        {
          itemId: currentItem.id,
          commentData: {
            text: newComment,
            attachments: attachments.length > 0 ? attachments : undefined,
            ...(isTasklist && { is_tasklist: true }),
          },
        },
        {
          onSuccess(data) {
            // Update cache with actual server data
            revalidateGalleryItemVersions(data);
            // Replace temporary comment with real comment from server
            setCurrentItem(data);
          },
        }
      );
    } catch (error) {
      // Rollback optimistic update on error
      setCurrentItem(item);
      toast.error("Failed to add comment");
      console.error("Add comment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!replyText.trim() && replyAttachments.length === 0) return;
    if (!currentItem?.id || !user?.id) {
      toast.error("Please log in to add a reply");
      return;
    }

    setIsSubmitting(true);

    // Create a temporary reply for optimistic update
    const tempReplyId = `temp-${Date.now()}`;
    const optimisticReply: CommentReply = {
      id: tempReplyId,
      text: replyText,
      added_by: user.id,
      added_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachments: replyAttachments.length > 0 ? replyAttachments : undefined,
      likes: [],
      added_by_name: user.name,
      added_by_role: user.role.name,
    };

    // Optimistically update the UI
    setCurrentItem((prev) =>
      prev
        ? {
            ...prev,
            comments: prev.comments?.map((comment) =>
              comment.id === commentId
                ? {
                    ...comment,
                    replies: [...(comment.replies || []), optimisticReply],
                  }
                : comment
            ),
          }
        : prev
    );

    // Clear input fields immediately
    setReplyText("");
    setReplyingTo(null);
    setReplyAttachments([]);

    try {
      galleryActions.addReply(
        {
          itemId: currentItem.id,
          commentId,
          replyData: {
            text: replyText,
            attachments:
              replyAttachments.length > 0 ? replyAttachments : undefined,
          },
        },
        {
          onSuccess(data) {
            // Update cache with actual server data
            revalidateGalleryItemVersions(data);
            setCurrentItem(data);
          },
        }
      );
    } catch (error) {
      setCurrentItem(item);
      toast.error("Failed to add reply");
      console.error("Add reply error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string, text: string) => {
    const toastId = `update-comment-${commentId}`; // unique ID
    toast.loading("Updating comment...", { id: toastId });
    try {
      if (!currentItem?.id) {
        setIsSubmitting(false);
        return;
      }

      // Optimistic update
      const previousComments = currentItem.comments || [];
      const optimisticComments = previousComments.map((comment) =>
        comment.id === commentId ? { ...comment, text } : comment
      );

      setCurrentItem((prev) =>
        prev ? { ...prev, comments: optimisticComments } : prev
      );

      galleryActions.patchComment(
        {
          itemId: currentItem?.id,
          commentId,
          updateData: { text },
        },
        {
          onSuccess(data) {
            revalidateGalleryItemVersions(data);
            setCurrentItem(data);
            toast.info("Comment updated", { id: toastId });
            setEditingComment(null);
          },
          onError(error) {
            // Rollback optimistic update
            setCurrentItem((prev) =>
              prev ? { ...prev, comments: previousComments } : prev
            );
            console.error(error);
            toast.error("Failed to update comment", { id: toastId });
          },
        }
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to update comment", { id: toastId });
    }
  };

  const handleUpdateReply = async (
    commentId: string,
    replyId: string,
    text: string
  ) => {
    const toastId = `update-reply-${commentId}-${replyId}`; // unique ID
    toast.loading("Updating reply...", { id: toastId });
    try {
      if (!currentItem?.id) {
        setIsSubmitting(false);
        return;
      }

      // Optimistic update
      const previousComments = currentItem.comments || [];
      const optimisticComments = previousComments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              replies: (comment.replies || []).map((reply) =>
                reply.id === replyId ? { ...reply, text } : reply
              ),
            }
          : comment
      );

      setCurrentItem((prev) =>
        prev ? { ...prev, comments: optimisticComments } : prev
      );

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
            setCurrentItem(data);
            toast.info("Reply updated", { id: toastId });
            setEditingReply(null);
          },
          onError(error) {
            // Rollback optimistic update
            setCurrentItem((prev) =>
              prev ? { ...prev, comments: previousComments } : prev
            );
            console.error(error);
            toast.error("Failed to update reply", { id: toastId });
          },
        }
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to update reply", { id: toastId });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentItem?.id) {
      setIsSubmitting(false);
      return;
    }

    // Optimistic update - remove comment immediately
    const previousComments = currentItem.comments || [];
    const optimisticComments = previousComments.filter(
      (comment) => comment.id !== commentId
    );

    setCurrentItem((prev) =>
      prev ? { ...prev, comments: optimisticComments } : prev
    );

    try {
      galleryActions.deleteComment(
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
            toast.success("Comment deleted");
          },
          onError(error) {
            // Rollback optimistic update
            setCurrentItem((prev) =>
              prev ? { ...prev, comments: previousComments } : prev
            );
            console.error(error);
            toast.error("Failed to delete comment");
          },
        }
      );
    } catch (error) {
      // Rollback optimistic update
      setCurrentItem((prev) =>
        prev ? { ...prev, comments: previousComments } : prev
      );
      console.error(error);
      toast.error("Failed to delete comment");
    }
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!currentItem?.id) {
      setIsSubmitting(false);
      return;
    }

    // Optimistic update - remove reply immediately
    const previousComments = currentItem.comments || [];
    const optimisticComments = previousComments.map((comment) =>
      comment.id === commentId
        ? {
            ...comment,
            replies: (comment.replies || []).filter(
              (reply) => reply.id !== replyId
            ),
          }
        : comment
    );

    setCurrentItem((prev) =>
      prev ? { ...prev, comments: optimisticComments } : prev
    );

    try {
      galleryActions.deleteReply(
        {
          itemId: currentItem?.id,
          commentId,
          replyId,
        },
        {
          onSuccess(data) {
            revalidateGalleryItemVersions(data);
            setCurrentItem(data);
            toast.success("Reply deleted");
          },
          onError(error) {
            // Rollback optimistic update
            setCurrentItem((prev) =>
              prev ? { ...prev, comments: previousComments } : prev
            );
            console.error(error);
            toast.error("Failed to delete reply");
          },
        }
      );
    } catch (error) {
      // Rollback optimistic update
      setCurrentItem((prev) =>
        prev ? { ...prev, comments: previousComments } : prev
      );
      console.error(error);
      toast.error("Failed to delete reply");
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

  const handleConfirmAskKittyKat = async (newComment?: {
    text: string;
    attachments?: string[];
  }) => {
    try {
      if (!currentItem?.id) {
        setIsSubmitting(false);
        return;
      }

      // If there's a new comment, submit it first
      if (newComment && user) {
        setIsSubmitting(true);

        try {
          galleryActions.addComment(
            {
              itemId: currentItem.id,
              commentData: {
                text: newComment.text,
                attachments:
                  newComment.attachments && newComment.attachments.length > 0
                    ? newComment.attachments
                    : undefined,
                is_tasklist: true,
              },
            },
            {
              onSuccess(data) {
                // Update cache with actual server data
                revalidateGalleryItemVersions(data);
                // Set the current item to the server response directly
                setCurrentItem(data);
              },
            }
          );
        } catch (error) {
          toast.error("Failed to add comment");
          console.error("Add comment error:", error);
          setIsSubmitting(false);
          return;
        }

        setIsSubmitting(false);
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
            setCurrentItem(data);
            revalidateGalleryItemVersions(data);
          },
          onError() {
            setCurrentItem(item);
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
    const loadedItemsCount = galleryActions.getGalleryItems().length;
    if (
      loadedItemsCount - currentIndex <= prefetchThreshold &&
      galleryActions.hasNextPage &&
      !galleryActions.isFetchingNextPage
    ) {
      galleryActions.fetchNextPage();
    }
  }, [
    currentIndex,
    galleryActions.getGalleryItems().length,
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
          className="p-0 h-[100dvh] w-[100dvw] max-w-[100dvw]! min-w-full rounded-none shadow-xl overflow-hidden flex flex-col"
        >
          {/* Fixed Header */}
          <DialogHeader className="px-6 py-4 bg-white border-b flex-shrink-0 z-10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-semibold">
                Concept Visual Editor
              </DialogTitle>
              <div className="flex items-center gap-4">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="p-2 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Content Area */}
          <div className="flex-1 min-h-0">
            <div className="flex h-full gap-x-3 p-4">
              {/* Left Panel - Static */}
              <div className="w-[35%] min-w-[280px] flex flex-col gap-y-4">
                {versions.isFetching ? (
                  <div className="relative w-full h-full flex items-center justify-center animate-pulse">
                    <div
                      className="
      bg-gray-200 rounded-lg
      w-full max-w-4xl
      h-20
      sm:h-[16rem] 
      md:h-[24rem] 
      lg:h-[36rem] 
      xl:h-[40rem]
    "
                    ></div>
                  </div>
                ) : currentItem ? (
                  activeTab === "video-gen" &&
                  currentItem.asset_type === "image" ? (
                    <VideoGenerationInput
                      item={currentItem}
                      campaignId={campaignId}
                    />
                  ) : (
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
                      revalidateGalleryItemVersions={
                        revalidateGalleryItemVersions
                      }
                      setCurrentItem={setCurrentItem}
                    />
                  )
                ) : null}
                {item && (
                  <AskKittykatVersions
                    item={item}
                    currentVersion={currentItem}
                    onVersionChange={(updatedItem) => {
                      setCurrentItem(updatedItem);
                    }}
                    ref={versionsRef}
                    versions={versions}
                  />
                )}
              </div>

              {/* Right Panel - Scrollable */}
              <div className="flex-1 w-[65%] flex flex-col min-h-0 overflow-y-auto">
                {currentItem ? (
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex-1 flex flex-col bg-none"
                  >
                    <AskKittykatTabs
                      isVideoAsset={currentItem.asset_type === "video"}
                    />

                    {currentItem.asset_type !== "video" && (
                      <AskKittykatImageEditingTools
                        item={currentItem}
                        remixControls={{
                          image: {
                            url: currentItem.asset_url,
                            size: currentItem.size || "original",
                          },
                          source: "media-gallery",
                          canUndo: remixHistory.canUndo,
                          canRedo: remixHistory.canRedo,
                          onUndo: handleUndo,
                          onRedo: handleRedo,
                          onClear: handleClear,
                          offScreenCanvasRef,
                          brushSize,
                          onBrushSizeChange: handleBrushSizeChange,
                          closeDialog: () => onOpenChange(false),
                          campaignId: campaign_id,
                        }}
                      />
                    )}

                    <TabsContent value="video-gen" className="flex-1 h-full">
                      <VideoGeneration heightRef={versionsRef} />
                    </TabsContent>

                    <TabsContent
                      value="ask-kittykat"
                      className="flex-1 flex flex-col min-h-0"
                    >
                      {/* Comments Section */}
                      <div className="flex-1 p-4 space-y-4 min-h-0">
                        <div className="space-y-4">
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

                      {/* Comment Input Section */}
                      <div className="border-t bg-white p-4 space-y-3">
                        <div className="space-y-3">
                          <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Ask KittyKat Experts for help with editing this image..."
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
                                onChange={(e) =>
                                  handleFileUpload(e.target.files)
                                }
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
                              onClick={() => handleSubmitComment()}
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

                      {/* Review Status Section */}
                      <div className="bg-gray-50 border-t">
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
                ) : (
                  <div className="flex-1 flex flex-col p-4">
                    <div className="animate-pulse space-y-4">
                      <div className="flex space-x-4 mb-6">
                        <div className="h-8 bg-gray-200 rounded w-32"></div>
                        <div className="h-8 bg-gray-200 rounded w-32"></div>
                        <div className="h-8 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="space-y-4 flex-1">
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-8 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {currentItem && (
        <AskKittyKatConfirmationDialog
          open={showConfirmDialog}
          setOpen={setShowConfirmDialog}
          onConfirm={handleConfirmAskKittyKat}
          comments={currentItem?.comments || []}
          imageUrl={currentItem?.asset_url || ""}
          brandId={currentItem?.brand_id}
          campaignId={currentItem?.campaign_id}
          imageId={currentItem?.id}
        />
      )}
    </>
  );
}
