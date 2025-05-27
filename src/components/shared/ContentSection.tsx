"use client";
import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import React from "react";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";
import { toast } from "sonner";
import { TooltipIconButton } from "../thread/tooltip-icon-button";
import { PinIcon } from "../ui/custom-icon";
import { Context } from "@/types/types";
import { cn } from "@/lib/utils";
import { isEqual } from "lodash";

interface ContentSectionProps {
  title: string;
  content: React.ReactNode;
  context: Context;
}

export function ContentSection({
  title,
  content,
  context,
}: ContentSectionProps) {
  const [copied, setCopied] = useState(false);
  const { addPinnedItem, removePinnedItem, pinnedItem } =
    usePinnedContextStore();
  const isPinned = useMemo(() => {
    return (
      pinnedItem?.title === title &&
      isEqual(pinnedItem?.context?.data, context.data)
    );
  }, [pinnedItem, content, title]);

  const handleCopy = async () => {
    try {
      const contextText =
        typeof context === "string" ? context : JSON.stringify(context.data);
      await navigator.clipboard.writeText(contextText);
      setCopied(true);
      toast.success(`${title} has been copied`, { position: "top-right" });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
      toast.error("Failed to copy context", { position: "top-right" });
    }
  };

  const handlePin = () => {
    if (isPinned) {
      removePinnedItem();
      toast(`${title} has been unpinned`, { position: "top-right" });
    } else {
      addPinnedItem({
        title,
        context,
      });
      toast(`${title} has been pinned`, { position: "top-right" });
    }
  };

  return (
    <div className="border border-gray-400 rounded-2xl overflow-hidden">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[#171a1f]">{title}</h3>
          <div className="flex items-center space-x-2">
            <TooltipIconButton
              tooltip="Copy context"
              onClick={handleCopy}
              className="text-[#6e7787] hover:text-[#171a1f] transition"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </TooltipIconButton>
            <TooltipIconButton
              tooltip={isPinned ? "Unpin context" : "Pin context"}
              onClick={handlePin}
              className={`transition hover:text-[#171a1f]`}
            >
              <PinIcon
                size={18}
                className={cn("text-[#6e7787]", {
                  "text-primary": isPinned,
                })}
              />
            </TooltipIconButton>
          </div>
        </div>
        <div>{content}</div>
      </div>
    </div>
  );
}
