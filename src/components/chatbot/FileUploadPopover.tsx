import { ChangeEvent, useRef, useState } from "react";
import { Loader2, Plus, FileImage, FileText } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { TooltipIconButton } from "../thread/tooltip-icon-button";
import { useQueryState } from "nuqs";

type FileTriggerType = "image" | "file";

export function FileUploadPopover({
  isFileUploading,
  handleAddFiles,
}: {
  isFileUploading: boolean;
  handleAddFiles: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [threadId] = useQueryState("threadId");
  const [acceptType, setAcceptType] = useState<string>("");
  const [open, setOpen] = useState(false);

  const triggerInput = (type: FileTriggerType) => {
    const accept = type === "image" ? "image/*" : ".pdf";
    setAcceptType(accept);
    setOpen(false); // Close popover
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const disabled = isFileUploading || !threadId;
  const tooltipText = !threadId
    ? "Initiate a conversation to upload a file"
    : "Add Photos and Files";

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <TooltipIconButton
            tooltip={tooltipText}
            variant="ghost"
            size="icon"
            className="p-1 h-auto w-auto rounded-full"
          >
            {isFileUploading ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <Plus className="size-4" />
            )}
          </TooltipIconButton>
        </PopoverTrigger>

        {/* Show popover only if not disabled */}
        {!disabled && (
          <PopoverContent className="w-40 space-y-1 px-2 py-2">
            <button
              onClick={() => triggerInput("image")}
              className="flex items-center gap-2 text-sm w-full px-2 py-1 rounded hover:bg-muted/50 transition"
              disabled={disabled}
            >
              <FileImage className="size-4" />
              <span>Upload Images</span>
            </button>
            <button
              onClick={() => triggerInput("file")}
              className="flex items-center gap-2 text-sm w-full px-2 py-1 rounded hover:bg-muted/50 transition"
              disabled={disabled}
            >
              <FileText className="size-4" />
              <span>Upload Files</span>
            </button>
          </PopoverContent>
        )}
      </Popover>

      {/* Hidden input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptType}
        className="hidden"
        onChange={handleAddFiles}
        multiple
        disabled={isFileUploading}
      />
    </>
  );
}
