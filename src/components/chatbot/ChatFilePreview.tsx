import React from "react";
import type { URLContentBlock } from "@langchain/core/messages";

import { cn } from "@/lib/utils";
import { FilePreview } from "./FilePreview";

interface ChatFilePreviewProps {
  blocks: URLContentBlock[];
  onRemove: (idx: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Renders a preview of content blocks with optional remove functionality.
 * Uses cn utility for robust class merging.
 */
export const ChatFilePreview: React.FC<ChatFilePreviewProps> = ({
  blocks,
  onRemove,
  size = "md",
  className,
}) => {
  console.log("chatfile", blocks);
  if (!blocks?.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-2 p-3.5 pb-0", className)}>
      {blocks.map((block, idx) => (
        <FilePreview
          key={idx}
          block={block}
          removable
          onRemove={() => onRemove(idx)}
          size={size}
        />
      ))}
    </div>
  );
};
