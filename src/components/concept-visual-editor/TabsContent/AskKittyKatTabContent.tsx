import { AskKittykatCommentGuidelines } from "@/app/(main)/gallery/_components/AskKittykatCommentGuidelines";
import { AskKittykatCommentItem } from "@/app/(main)/gallery/_components/AskKittykatCommentItem";
import { AskKittyKatConfirmationDialog } from "@/app/(main)/gallery/_components/AskKittyKatConfirmationDialog";
import { AskKittykatReplyInput } from "@/app/(main)/gallery/_components/AskKittykatReplyInput";
import { AskKittykatReplyList } from "@/app/(main)/gallery/_components/AskKittykatReplyList";
import { AskKittykatReviewStatus } from "@/app/(main)/gallery/_components/AskKittykatReviewStatus";
import { Button } from "@/components/ui/button";
import ZoomableImage from "@/components/ui/zoomable-image";
import ZoomableVideo from "@/components/ui/zoomable-video";
import { GalleryActions } from "@/hooks/useGallery";
import { getAssetTypeFromUrlCooked } from "@/lib/gallery.utils";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { useBrandStore } from "@/store/brand.store";
import { useConceptVisualStore } from "@/store/concept-visual.store";
import { useUserStore } from "@/store/user.store";
import {
  CommentReply,
  GalleryItemResponse,
  Comment,
} from "@/types/gallery.types";
import MDEditor from "@uiw/react-md-editor";
import { Paperclip, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type ImageUpcalerTabContentProps = {
  currentAsset: GalleryItemResponse;
  currentAssetVersion: GalleryItemResponse;
  setCurrentAssetVersion: React.Dispatch<
    React.SetStateAction<GalleryItemResponse | null>
  >;
  galleryActions: GalleryActions;
};

const AskKittyKatTabContent = ({
  currentAsset,
  currentAssetVersion,
  setCurrentAssetVersion,
  galleryActions,
}: ImageUpcalerTabContentProps) => {
  const { selectedBrandId, selectedCampaignId } = useBrandStore();
  const { updateAssetItem } = useConceptVisualStore();
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

  const handleVersionUpdate = async (updatedVersion: GalleryItemResponse) => {
    // Use the common revalidation function from galleryActions
    galleryActions.revalidateGalleryItemVersions(currentAsset.id, updatedVersion);

    // Update the store's assetItems if the updated version is the current asset
    if (updatedVersion.id === currentAsset.id) {
      updateAssetItem(currentAsset.id, updatedVersion);
    }

    // Update local state if this is the currently displayed version
    setCurrentAssetVersion((prev) => {
      if (!prev || prev.id !== updatedVersion.id) {
        return prev;
      }
      return updatedVersion;
    });
  };

  useEffect(() => {
    setNewComment("");
    setReplyingTo(null);
    setReplyText("");
    setEditingComment(null);
    setEditingReply(null);
    setAttachments([]);
    setReplyAttachments([]);
  }, [currentAssetVersion.id]);

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
          selectedBrandId,
          selectedCampaignId
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
    if (!currentAssetVersion?.id || !user?.id) {
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
    setCurrentAssetVersion((prev) =>
      prev
        ? {
            ...prev,
            comments: [...(prev.comments || []), optimisticComment],
          }
        : prev
    );

    scrollRef.current?.scrollIntoView({ behavior: "smooth" });

    // Clear input fields immediately
    setNewComment("");
    setAttachments([]);

    try {
      await galleryActions.addComment(
        {
          itemId: currentAssetVersion.id,
          commentData: {
            text: newComment,
            attachments: attachments.length > 0 ? attachments : undefined,
            ...(isTasklist && { is_tasklist: true }),
          },
        },
        {
          onSuccess(data) {
            // Update cache with actual server data
            handleVersionUpdate(data);
            // Only update currentAssetVersion if the response is for the current version
            if (data.id === currentAssetVersion?.id) {
              setCurrentAssetVersion(data);
            }
          },
        }
      );
    } catch (error) {
      // Rollback optimistic update on error
      setCurrentAssetVersion((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments?.filter((c) => c.id !== tempCommentId) || [],
        };
      });
      toast.error("Failed to add comment");
      console.error("Add comment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!replyText.trim() && replyAttachments.length === 0) return;
    if (!currentAssetVersion?.id || !user?.id) {
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
    setCurrentAssetVersion((prev) =>
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
          itemId: currentAssetVersion.id,
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
            handleVersionUpdate(data);
            // Only update currentAssetVersion if the response is for the current version
            if (data.id === currentAssetVersion?.id) {
              setCurrentAssetVersion(data);
            }
          },
        }
      );
    } catch (error) {
      // Don't reset currentAssetVersion on error - preserve the current version
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
      if (!currentAssetVersion?.id) {
        setIsSubmitting(false);
        return;
      }

      // Optimistic update
      const previousComments = currentAssetVersion.comments || [];
      const optimisticComments = previousComments.map((comment) =>
        comment.id === commentId ? { ...comment, text } : comment
      );

      setCurrentAssetVersion((prev) =>
        prev ? { ...prev, comments: optimisticComments } : prev
      );

      galleryActions.patchComment(
        {
          itemId: currentAssetVersion?.id,
          commentId,
          updateData: { text },
        },
        {
          onSuccess(data) {
            handleVersionUpdate(data);
            // Only update currentAssetVersion if the response is for the current version
            if (data.id === currentAssetVersion?.id) {
              setCurrentAssetVersion(data);
            }
            toast.info("Comment updated", { id: toastId });
            setEditingComment(null);
          },
          onError(error) {
            // Rollback optimistic update
            setCurrentAssetVersion((prev) =>
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
      if (!currentAssetVersion?.id) {
        setIsSubmitting(false);
        return;
      }

      // Optimistic update
      const previousComments = currentAssetVersion.comments || [];
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

      setCurrentAssetVersion((prev) =>
        prev ? { ...prev, comments: optimisticComments } : prev
      );

      galleryActions.patchReply(
        {
          itemId: currentAssetVersion?.id,
          commentId,
          replyId,
          updateData: { text },
        },
        {
          onSuccess(data) {
            handleVersionUpdate(data);
            // Only update currentAssetVersion if the response is for the current version
            if (data.id === currentAssetVersion?.id) {
              setCurrentAssetVersion(data);
            }
            toast.info("Reply updated", { id: toastId });
            setEditingReply(null);
          },
          onError(error) {
            // Rollback optimistic update
            setCurrentAssetVersion((prev) =>
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
    if (!currentAssetVersion?.id) {
      setIsSubmitting(false);
      return;
    }

    // Optimistic update - remove comment immediately
    const previousComments = currentAssetVersion.comments || [];
    const optimisticComments = previousComments.filter(
      (comment) => comment.id !== commentId
    );

    setCurrentAssetVersion((prev) =>
      prev ? { ...prev, comments: optimisticComments } : prev
    );

    try {
      galleryActions.deleteComment(
        {
          itemId: currentAssetVersion?.id,
          commentId,
        },
        {
          onSuccess() {
            // Update the versions cache to persist the deletion
            const updatedVersion: GalleryItemResponse = {
              ...currentAssetVersion,
              comments: optimisticComments,
            };
            handleVersionUpdate(updatedVersion);
            toast.success("Comment deleted");
          },
          onError(error) {
            // Rollback optimistic update
            setCurrentAssetVersion((prev) =>
              prev ? { ...prev, comments: previousComments } : prev
            );
            console.error(error);
            toast.error("Failed to delete comment");
          },
        }
      );
    } catch (error) {
      // Rollback optimistic update
      setCurrentAssetVersion((prev) =>
        prev ? { ...prev, comments: previousComments } : prev
      );
      console.error(error);
      toast.error("Failed to delete comment");
    }
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!currentAssetVersion?.id) {
      setIsSubmitting(false);
      return;
    }

    // Optimistic update - remove reply immediately
    const previousComments = currentAssetVersion.comments || [];
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

    setCurrentAssetVersion((prev) =>
      prev ? { ...prev, comments: optimisticComments } : prev
    );

    try {
      galleryActions.deleteReply(
        {
          itemId: currentAssetVersion?.id,
          commentId,
          replyId,
        },
        {
          onSuccess(data) {
            handleVersionUpdate(data);
            // Only update currentAssetVersion if the response is for the current version
            if (data.id === currentAssetVersion?.id) {
              setCurrentAssetVersion(data);
            }
            toast.success("Reply deleted");
          },
          onError(error) {
            // Rollback optimistic update
            setCurrentAssetVersion((prev) =>
              prev ? { ...prev, comments: previousComments } : prev
            );
            console.error(error);
            toast.error("Failed to delete reply");
          },
        }
      );
    } catch (error) {
      // Rollback optimistic update
      setCurrentAssetVersion((prev) =>
        prev ? { ...prev, comments: previousComments } : prev
      );
      console.error(error);
      toast.error("Failed to delete reply");
    }
  };

  const handleLikeComment = (comment: Comment, itemId: string) => {
    const alreadyLiked = (comment?.likes ?? []).includes(user?.id ?? "");
    const likeAction = alreadyLiked ? "remove" : "add";
    const prevComments = currentAssetVersion?.comments || [];

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

    setCurrentAssetVersion((prev) =>
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
          handleVersionUpdate(data);
        },
        onError() {
          setCurrentAssetVersion((prev) =>
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
    const prevComments = currentAssetVersion?.comments || [];

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

    setCurrentAssetVersion((prev) =>
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
          handleVersionUpdate(data);
        },
        onError: () => {
          setCurrentAssetVersion((prev) =>
            prev ? { ...prev, comments: prevComments } : prev
          );
        },
      }
    );
  };

  const handleAskKittyKat = async () => {
    if (currentAssetVersion?.sent_to_human_queue) {
      toast.info("This item is already in the human editing queue");
      return;
    }
    setShowConfirmDialog(true);
  };

  const [allAttachments, setAllAttachments] = useState<string[]>([]);

  const handleConfirmAskKittyKat = async (newComment?: {
    text: string;
    attachments?: string[];
  }) => {
    try {
      if (!currentAssetVersion?.id) {
        setIsSubmitting(false);
        return;
      }

      // If there's a new comment, submit it first
      if (newComment && user) {
        setIsSubmitting(true);

        try {
          galleryActions.addComment(
            {
              itemId: currentAssetVersion.id,
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
                handleVersionUpdate(data);
                // Only update currentAssetVersion if the response is for the current version
                if (data.id === currentAssetVersion?.id) {
                  setCurrentAssetVersion(data);
                }
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
          itemId: currentAssetVersion?.id,
          data: {
            sent_to_human_queue: true,
            workflow_status: "request_created",
            sent_to_queue_at: new Date().toISOString(),
          },
        },
        {
          onSuccess(data) {
            // Only update currentAssetVersion if the response is for the current version
            if (data.id === currentAssetVersion?.id) {
              setCurrentAssetVersion(data);
            }
            handleVersionUpdate(data);
          },
          onError() {
            // Don't reset currentAssetVersion on error - preserve the current version
            // The user should stay on the version they were working on
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

  const hasComments =
    currentAssetVersion?.comments && currentAssetVersion.comments.length > 0;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentAssetVersion.comments?.length]);

  return (
    <>
      {/* Comments Section */}
      <div
        className={`${
          currentAssetVersion.sent_to_human_queue
            ? "max-h-[calc(100vh-460px)]"
            : "max-h-[calc(100vh-520px)]"
        } flex-1 p-4 space-y-4 overflow-y-scroll`}
      >
        <div className="space-y-4">
          {!hasComments ? (
            <AskKittykatCommentGuidelines />
          ) : (
            <div className="space-y-4">
              {currentAssetVersion.comments?.map((comment) => (
                <div key={comment.id} className="space-y-3">
                  <AskKittykatCommentItem
                    comment={comment}
                    itemId={currentAssetVersion.id}
                    editingCommentId={editingComment}
                    setEditingComment={setEditingComment}
                    setReplyingTo={setReplyingTo}
                    onUpdateComment={handleUpdateComment}
                    onDeleteComment={handleDeleteComment}
                    onLikeComment={handleLikeComment}
                    isDeletingReply={galleryActions.isDeletingReply}
                  />
                  <AskKittykatReplyList
                    replies={comment.replies}
                    commentId={comment.id}
                    itemId={currentAssetVersion.id}
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
        <div ref={scrollRef} />
      </div>

      {/* Comment Input Section */}
      <div className="border-t bg-white p-2 space-y-3">
        <div className="space-y-3">
          <div data-color-mode="light">
            <MDEditor
              value={newComment}
              onChange={(val) => setNewComment(val || "")}
              preview="edit"
              hideToolbar={false}
              visibleDragbar={false}
              toolbarHeight={40}
              textareaProps={{
                style: {
                  fontSize: 14,
                  lineHeight: 1.6,
                  fontFamily:
                    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
                  padding: "12px",
                  border: "none",
                  outline: "none",
                  resize: "none",
                },
                placeholder:
                  "Ask KittyKat Experts for help with editing this image...",
              }}
              previewOptions={{
                style: {
                  padding: "12px",
                  fontSize: 14,
                  lineHeight: 1.6,
                },
              }}
              height={120}
              data-testid="comment-markdown-editor"
            />
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-row gap-x-2">
              {attachments.map((url, idx) => {
                const mediaType = getAssetTypeFromUrlCooked(url);
                return (
                  <div key={idx} className="relative">
                    {mediaType === "video" ? (
                      <ZoomableVideo
                        key={idx}
                        src={url}
                        className="w-16 h-16 object-contain rounded border cursor-pointer"
                      />
                    ) : (
                      <ZoomableImage
                        key={idx}
                        src={url}
                        className="w-16 h-16 object-cover rounded border cursor-pointer"
                      />
                    )}

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
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
                accept="image/*,video/*"
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
                isSubmitting || (!newComment.trim() && attachments.length === 0)
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
          item={currentAssetVersion}
          revalidateGalleryItemVersions={handleVersionUpdate}
          setCurrentItem={setCurrentAssetVersion}
        />
      </div>

      {currentAssetVersion && (
        <AskKittyKatConfirmationDialog
          open={showConfirmDialog}
          setOpen={setShowConfirmDialog}
          onConfirm={handleConfirmAskKittyKat}
          comments={currentAssetVersion?.comments || []}
          imageUrl={currentAssetVersion?.asset_url || ""}
          brandId={currentAssetVersion?.brand_id}
          campaignId={currentAssetVersion?.campaign_id}
          imageId={currentAssetVersion?.id}
          allAttachments={allAttachments}
          onAllAttachmentsChange={setAllAttachments}
        />
      )}
    </>
  );
};

export default AskKittyKatTabContent;
