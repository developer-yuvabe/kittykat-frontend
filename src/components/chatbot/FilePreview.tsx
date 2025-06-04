import React from "react";
import { File, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchFileType } from "@/lib/langgraph.utils";
import { ContentBlock } from "@/hooks/useFileUploadToAgent";
import { URLContentBlock } from "@langchain/core/messages";

export interface FilePreviewProps {
  block: ContentBlock;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  block,
  removable = false,
  onRemove,
  className,
  size = "md",
}) => {
  const [mimeType, setMimeType] = React.useState<string>("");

  const isUrlSource = block.source_type === "url";

  React.useEffect(() => {
    if (isUrlSource && "url" in block) {
      let isMounted = true;
      fetchFileType(block.url).then((type) => {
        if (isMounted) setMimeType(type);
      });
      return () => {
        isMounted = false;
      };
    }
  }, [isUrlSource, block]);

  const getFilename = (): string => {
    console.log(block.metadata);
    return (
      (block.metadata?.filename as string) ||
      (block.metadata?.name as string) ||
      (typeof block.metadata?.threadFileResponse === "object" &&
      block.metadata?.threadFileResponse !== null &&
      "filename" in block.metadata.threadFileResponse
        ? (block.metadata.threadFileResponse as { filename?: string }).filename
        : undefined) ||
      (isUrlSource
        ? (block as URLContentBlock).url.split("/").pop()!
        : "Uploaded File")
    );
  };

  // ✅ IMAGE PREVIEW (URL only)
  if (block.type === "image" && isUrlSource && mimeType.startsWith("image/")) {
    const imgClass = cn(
      "rounded-md object-cover",
      size === "sm" && "h-10 w-10",
      size === "md" && "h-16 w-16",
      size === "lg" && "h-24 w-24"
    );

    const imgSize = size === "sm" ? 40 : size === "md" ? 64 : 96;

    return (
      <div className={cn("relative inline-block", className)}>
        <img
          src={(block as URLContentBlock).url}
          alt={String(block.metadata?.name || "uploaded image")}
          className={imgClass}
          width={imgSize}
          height={imgSize}
        />
        {removable && (
          <button
            type="button"
            className="absolute top-1 right-1 z-10 rounded-full bg-gray-500 text-white hover:bg-gray-700"
            onClick={onRemove}
            aria-label="Remove image"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // ✅ PDF PREVIEW
  if (block.type === "file" && isUrlSource && mimeType === "application/pdf") {
    return (
      <div
        className={cn(
          "relative flex items-start gap-2 rounded-md border bg-gray-100 px-3 py-2",
          className
        )}
      >
        <File
          className={cn("text-teal-700", size === "sm" ? "h-5 w-5" : "h-7 w-7")}
        />
        <span
          className={cn("min-w-0 flex-1 text-sm break-all text-gray-800")}
          style={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}
        >
          {getFilename()}
        </span>
        {removable && (
          <button
            type="button"
            className="ml-2 self-start rounded-full bg-gray-200 p-1 text-teal-700 hover:bg-gray-300"
            onClick={onRemove}
            aria-label="Remove PDF"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // ✅ Default Fallback
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border bg-gray-100 px-3 py-2 text-gray-500",
        className
      )}
    >
      <File className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm break-all">{getFilename()}</span>
      {removable && (
        <button
          type="button"
          className="ml-2 rounded-full bg-gray-200 p-1 text-gray-500 hover:bg-gray-300"
          onClick={onRemove}
          aria-label="Remove file"
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
