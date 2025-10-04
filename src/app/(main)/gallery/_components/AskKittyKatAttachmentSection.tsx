"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Paperclip } from "lucide-react";
import { AskKittyKatAttachmentPreview } from "./AskKittyKatAttachmentPreview";

interface AskKittyKatAttachmentSectionProps {
  allAttachments: string[];
  newCommentAttachments: string[];
  onRemoveAttachment: (index: number) => void;
  onFileUpload: (files: FileList | null) => void;
  isUploading: boolean;
}

export function AskKittyKatAttachmentSection({
  allAttachments,
  newCommentAttachments,
  onRemoveAttachment,
  onFileUpload,
  isUploading,
}: AskKittyKatAttachmentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachFiles = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const totalAttachments = allAttachments.length + newCommentAttachments.length;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">
          Attachments ({totalAttachments})
        </h4>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => onFileUpload(e.target.files)}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleAttachFiles}
            disabled={isUploading}
            className="h-7 px-2"
          >
            {isUploading ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Paperclip className="h-3 w-3 mr-1" />
            )}
            {isUploading ? "Uploading..." : "Add Images"}
          </Button>
        </div>
      </div>

      {totalAttachments > 0 && (
        <div className="space-y-3">
          <AskKittyKatAttachmentPreview
            attachments={[...allAttachments, ...newCommentAttachments]}
            onRemoveAttachment={(index) => {
              if (index < allAttachments.length) {
                onRemoveAttachment(index);
              }
            }}
          />
        </div>
      )}

      {totalAttachments === 0 && (
        <p className="text-xs text-gray-500">
          You can upload additional images to provide more context for your
          tasks.
        </p>
      )}
    </div>
  );
}
