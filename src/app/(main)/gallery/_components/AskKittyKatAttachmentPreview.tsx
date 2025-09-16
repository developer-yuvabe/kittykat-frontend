"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ZoomableImage from "@/components/ui/zoomable-image";

interface AskKittyKatAttachmentPreviewProps {
  attachments: string[];
  onRemoveAttachment: (index: number) => void;
  readonly?: boolean;
}

export function AskKittyKatAttachmentPreview({
  attachments,
  onRemoveAttachment,
  readonly = false,
}: AskKittyKatAttachmentPreviewProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-row gap-x-2">
      {attachments.map((url, idx) => (
        <div key={idx} className="relative">
          <ZoomableImage
            src={url}
            className="w-16 h-16 object-cover rounded border cursor-pointer"
          />
          {!readonly && (
            <Button
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 w-5 h-5 p-0"
              onClick={() => onRemoveAttachment(idx)}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
