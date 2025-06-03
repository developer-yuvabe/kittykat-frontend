import React from "react";
import { File, X as XIcon } from "lucide-react";
import type { URLContentBlock } from "@langchain/core/messages";
import { cn } from "@/lib/utils";
import { fetchFileType } from "@/lib/langgraph.utils";

export interface FilePreviewProps {
  block: URLContentBlock;
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

  React.useEffect(() => {
    let isMounted = true;
    fetchFileType(block.url).then((type) => {
      if (isMounted) setMimeType(type);
    });
    return () => {
      isMounted = false;
    };
  }, [block.url]);

  // IMAGE PREVIEW
  if (
    block.type === "image" &&
    block.source_type === "url" &&
    mimeType.startsWith("image/")
  ) {
    const imgClass = cn(
      "rounded-md object-cover",
      size === "sm" && "h-10 w-10 text-base",
      size === "md" && "h-16 w-16 text-lg",
      size === "lg" && "h-24 w-24 text-xl"
    );

    const imgSize = size === "sm" ? 40 : size === "md" ? 64 : 96;

    return (
      <div className={cn("relative inline-block", className)}>
        <img
          src={block.url}
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

  // PDF (and other files) PREVIEW
  if (
    block.type === "file" &&
    block.source_type === "url" &&
    mimeType === "application/pdf"
  ) {
    const filename =
      block.metadata?.filename || block.metadata?.name || "PDF file";

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
          {String(filename)}
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

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border bg-gray-100 px-3 py-2 text-gray-500",
        className
      )}
    >
      <File className="h-5 w-5 flex-shrink-0" />
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
