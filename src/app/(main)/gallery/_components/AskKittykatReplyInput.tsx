// components/AskKittykatReplyInput.tsx
import { useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Paperclip, X } from "lucide-react";
import ZoomableImage from "@/components/ui/zoomable-image";

interface AskKittykatReplyInputProps {
  replyText: string;
  setReplyText: (text: string) => void;
  replyAttachments: string[];
  setReplyAttachments: React.Dispatch<React.SetStateAction<string[]>>;
  isSubmitting: boolean;
  isUploading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onFileUpload: (files: FileList | null, isReply: boolean) => void;
}

export function AskKittykatReplyInput({
  replyText,
  setReplyText,
  replyAttachments,
  setReplyAttachments,
  isSubmitting,
  isUploading,
  onSubmit,
  onCancel,
  onFileUpload,
}: AskKittykatReplyInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="ml-11 space-y-2">
      <Textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder="Write a reply..."
        className="min-h-[60px] text-sm"
      />

      {/* Reply Attachments Preview */}
      {replyAttachments.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {replyAttachments.map((url, idx) => (
            <div key={idx} className="relative">
              <ZoomableImage
                src={url}
                key={idx}
                className="w-16 h-16 object-cover rounded border cursor-pointer"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 w-4 h-4 p-0"
                onClick={() =>
                  setReplyAttachments((prev) =>
                    prev.filter((_, i) => i !== idx)
                  )
                }
              >
                <X className="w-2 h-2" />
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
            onChange={(e) => onFileUpload(e.target.files, true)}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Paperclip className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={
              isSubmitting ||
              (!replyText.trim() && replyAttachments.length === 0)
            }
            className="bg-purple-600 hover:bg-purple-700"
          >
            Reply
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
