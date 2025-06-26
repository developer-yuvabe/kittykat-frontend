"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  X,
  Paperclip,
  Send,
  Shirt,
  Paintbrush,
  Video,
  ArrowUp,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import type { GalleryItemResponse } from "@/types/gallery.types";
import { AskKittykatImageSection } from "./AskKittykatImageSection";
import { AskKittykatCommentGuidelines } from "./AskKittykatCommentGuidelines";
import { AskKittykatCommentThread } from "./AskKittykatCommentThread";
import { AskKittykatTabs } from "./AskKittykatTabs";
import { GalleryActions } from "@/hooks/useGallery";
import { createMediaItemHelper } from "@/lib/gallery.utils";

interface MediaEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GalleryItemResponse | null;
  galleryActions: GalleryActions;
}

export function MediaEditorDialog({
  open,
  onOpenChange,
  item,
  galleryActions,
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
  const [editText, setEditText] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKittyKatUnlocked, setIsKittyKatUnlocked] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaHelper = createMediaItemHelper({
    patchItem: galleryActions.patchItem,
    addComment: galleryActions.addComment,
    updateComment: galleryActions.updateComment,
    deleteComment: galleryActions.deleteComment,
    toggleFavorite: galleryActions.toggleFavorite,
    bulkDelete: galleryActions.bulkDelete,
    deleteItem: galleryActions.deleteItem,
  });

  if (!item) return null;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
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
      setAttachments((prev) => [...prev, ...uploadedUrls]);
      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error) {
      toast.error("Failed to upload files");
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      galleryActions.addReply({
        itemId: item.id,
        commentId: commentId,
        replyData: {
          text: replyText,
        },
      });
      setReplyText("");
      setReplyingTo(null);
      setAttachments([]);
    } catch (error) {
      toast.error("Failed to add reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlockKittyKat = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmUnlock = () => {
    setIsKittyKatUnlocked(true);
    setShowConfirmDialog(false);
    toast.success("KittyKat unlocked! You can now add comments.");
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const hasComments = item.comments && item.comments.length > 0;
  const shouldShowLockedUI = !hasComments && !isKittyKatUnlocked;

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
            </div>
          </DialogHeader>

          <div className="flex flex-1/2 overflow-hidden gap-x-3">
            <AskKittykatImageSection
              item={item}
              onEdit={() => {
                // handle edit logic
              }}
              onAddVersion={() => {
                // handle add version
              }}
            />

            {/* Right Panel */}
            <div className="w-full flex-1/2 flex-col">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col bg-none"
              >
                <AskKittykatTabs />

                <TabsContent value="virtual-tryon" className="flex-1 p-4">
                  <div className="text-center text-gray-500 mt-8">
                    <Shirt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Virtual Try-On feature coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="in-paint" className="flex-1 p-4">
                  <div className="text-center text-gray-500 mt-8">
                    <Paintbrush className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>In-Paint Editing feature coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="video-gen" className="flex-1 p-4">
                  <div className="text-center text-gray-500 mt-8">
                    <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Video Generation feature coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="upscaler" className="flex-1 p-4">
                  <div className="text-center text-gray-500 mt-8">
                    <ArrowUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Image Upscaler feature coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent
                  value="ask-kittykat"
                  className="flex-1 flex flex-col"
                >
                  <div className="px-4 py-3 border-b">
                    <h2 className="font-semibold text-lg">Ask Kitty Kat</h2>
                  </div>

                  {/* Comments Section */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {shouldShowLockedUI ? (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60">
                        <div className="bg-gray-100 rounded-full p-6">
                          <Lock className="w-12 h-12 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-lg font-medium text-gray-700">
                            Ask KittyKat is Locked
                          </h4>
                          <p className="text-sm text-gray-500 max-w-md">
                            Ready to start your creative project? Click below to
                            unlock the comment system and begin collaborating
                            with our creative team.
                          </p>
                        </div>
                      </div>
                    ) : !hasComments ? (
                      <AskKittykatCommentGuidelines />
                    ) : (
                      <AskKittykatCommentThread
                        comments={item.comments || []}
                        onUpdateComment={mediaHelper.updateComment}
                        editingComment={editingComment}
                        editText={editText}
                        replyingTo={replyingTo}
                        replyText={replyText}
                        handleSubmitReply={handleSubmitReply}
                        setEditText={setEditText}
                        setEditingComment={setEditingComment}
                        setReplyingTo={setReplyingTo}
                        setReplyText={setReplyText}
                        formatTime={formatTime}
                        isSubmitting={isSubmitting}
                        itemId={item.id}
                      />
                    )}
                  </div>

                  {/* Add Comment Section or Unlock Button */}
                  <div className="border-t p-4 space-y-3">
                    {shouldShowLockedUI ? (
                      <div className="">
                        <Button
                          onClick={handleUnlockKittyKat}
                          className=" w-full"
                          size="lg"
                        >
                          <Lock className="w-5 h-5 mr-2" />
                          Ask KittyKat
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Ask KittyKat for help with editing this image..."
                          className="min-h-[80px] resize-none"
                        />

                        {/* Attachments Preview */}
                        {attachments.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {attachments.map((url, idx) => (
                              <div key={idx} className="relative">
                                <img
                                  src={url || "/placeholder.svg"}
                                  alt="Attachment"
                                  className="w-full h-16 object-cover rounded border"
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
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Alert Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent
          className="max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">
              Ready to Ask KittyKat?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 space-y-3">
              <p>
                Clicking Ask KittyKat will formally trigger the creative team to
                start work.
              </p>
              <p>
                Make sure your request is finalized in the comments and all
                required images are uploaded — changes after this point may not
                be possible and the request may become chargeable.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter
            className="flex gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <AlertDialogCancel
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirmDialog(false);
              }}
            >
              Back to editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUnlock}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
