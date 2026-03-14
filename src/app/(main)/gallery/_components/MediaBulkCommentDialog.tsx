"use client";

import { Upload, X, FileText, Image, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import React, { useState, useRef } from "react";
import type { GalleryItemResponse } from "@/types/gallery.types";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { GalleryActions } from "@/hooks/useGallery";
import { useUserStore } from "@/store/user.store";
import { v4 } from "uuid";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";

interface MediaBulkCommentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: GalleryItemResponse[];
  onUnselectAll: () => void;
  galleryActions: GalleryActions;
}

export function MediaBulkCommentDialog({
  isOpen,
  onClose,
  selectedItems,
  onUnselectAll,
  galleryActions,
}: MediaBulkCommentDialogProps) {
  const { user } = useUserStore();
  const [comment, setComment] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    } else if (file.type === "application/pdf") {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const resetDialog = () => {
    setComment("");
    setAttachments([]);
    onClose();
  };

  const handleBulkComment = async () => {
    if (!comment.trim()) return;

    setIsAddingComment(true);
    try {
      const uploadedUrls = await Promise.all(
        attachments.map((file) =>
          uploadFileAndReturnUrl(file.name, file.type, "ask-kittykat", file)
        )
      );

      const commentPayload = {
        text: `[batch-comment] ${comment.trim()}`,
        id: v4(),
        added_by: user?.id ?? "",
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attachments: uploadedUrls,
      };

      await Promise.all(
        selectedItems.map((item) =>
          galleryActions.patchItem?.({
            itemId: item.id,
            data: {
              comments: [commentPayload],
              workflow_status: "request_created",
            },
          })
        )
      );

      resetDialog();
      onUnselectAll();
      galleryActions.refetchGalleryItems();
    } catch (error) {
      console.error("Bulk comment error:", error);
    } finally {
      setIsAddingComment(false);
    }
  };

  return (
    <ReusableAlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) resetDialog();
      }}
      title="Add Batch Comment"
      description={
        <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-gray-600 font-medium mb-2">Need an edit?</p>
            <p className="mb-4">
              To request edits for this image, please follow the steps below:
            </p>

            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-semibold text-gray-800">Specify the changes:</span>{" "}
                Clearly describe what you want to modify, add, or remove in the image.
              </li>
              <li>
                <span className="font-semibold text-gray-800">Upload reference assets:</span>{" "}
                Attach any images, sketches, or files that can help clarify your request.
              </li>
              <li>
                <span className="font-semibold text-gray-800">Be as detailed as possible:</span>{" "}
                The more information you provide, the better we can assist you.
              </li>
            </ul>

            <p className="mt-4">
              Once submitted, our team will review your request and respond as soon as possible.
            </p>

            <p className="text-xs text-red-600 font-semibold mt-3">
              Note: Image edit requests are chargeable as per the scope of work.
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="comment" className="text-sm font-medium">
              Comment *
            </Label>
            <Textarea
              id="comment"
              placeholder="Enter your comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Attachments (Optional)</Label>

            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={handleDropZoneClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF, DOC, TXT up to 10MB each</p>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Attached Files ({attachments.length})</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAttachment(index)}
                        className="h-8 w-8 p-0 hover:bg-red-100"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      }
      confirmLabel="Add Comment"
      cancelLabel="Cancel"
      onConfirm={handleBulkComment}
      isLoading={isAddingComment}
      confirmDisabled={!comment.trim()}
    />
  );
}
