"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { AskKittyKatAttachmentPreview } from "./AskKittyKatAttachmentPreview";

interface AskKittyKatCommentInputProps {
  comment: string;
  onCommentChange: (comment: string) => void;
  attachments: string[];
  onAttachmentsChange: (attachments: string[]) => void;
  onGenerateTasks: () => void;
  isGeneratingTasks: boolean;
  brandId?: string | null;
  campaignId?: string | null;
  placeholder?: string;
}

export function AskKittyKatCommentInput({
  comment,
  onCommentChange,
  attachments,
  onAttachmentsChange,
  onGenerateTasks,
  isGeneratingTasks,
  brandId,
  campaignId,
  placeholder = "Ask KittyKat Experts for help with editing this image...",
}: AskKittyKatCommentInputProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
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
          brandId || null,
          campaignId || null
        );
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onAttachmentsChange([...attachments, ...uploadedUrls]);

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

  const handleRemoveAttachment = (index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };

  const handleAttachFiles = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleGenerateTasks = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerateTasks();
  };

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      <div className="space-y-3">
        <Textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[80px] resize-none"
          onClick={(e) => e.stopPropagation()}
        />

        <AskKittyKatAttachmentPreview
          attachments={attachments}
          onRemoveAttachment={handleRemoveAttachment}
        />

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
              onClick={handleAttachFiles}
              disabled={isUploading}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={handleGenerateTasks}
            disabled={isGeneratingTasks || isUploading || !comment.trim()}
            className="bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            {isGeneratingTasks ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              "Generate Tasks"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
